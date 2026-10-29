-- Push notifications to the parent's phone (issue #16).
--
-- When a family member reserves or buys something, the parent gets a push, following the
-- same rules as the app (mobile/src/domain/notifications.ts) and its wording (i18n `notify`):
--   surprise off      → who, when it's reserved and when it's bought
--   "taken care of"   → only that a wish is sorted, once it's bought, never who
--   "hide everything" → nothing at all
-- Found products are named; catalogue products aren't, because the catalogue lives in the
-- app and the server only knows their ids.
--
-- Claims queue a message in push_outbox; a job sends the queue through Expo's push service
-- every minute. Only the database touches the queue, so it can't be read or forged through the API.

create table public.push_tokens (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Expo push tokens look like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx].
  token text not null check (token ~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{8,100}\]$'),
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

create table public.push_outbox (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  list_id uuid not null references public.lists (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.push_tokens enable row level security;
alter table public.push_outbox enable row level security;

-- A phone registers its own token; nobody can see or remove anyone else's.
create policy push_tokens_own on public.push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.push_tokens, public.push_outbox from anon, authenticated;
grant select, insert, update, delete on public.push_tokens to authenticated;

-- Queues the parent's push for a new or newly-bought claim.
create function public.queue_claim_push() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_list public.lists;
  v_mode text;
  v_giver text;
  v_what text;
begin
  select * into v_list from public.lists where id = new.list_id;
  v_mode := coalesce(v_list.settings ->> 'surpriseMode', 'off');
  -- Nobody is told about their own action.
  if new.giver_id = v_list.owner_id then return new; end if;
  select coalesce('the ' || title, 'one of the wishes') into v_what
    from (select (select title from public.custom_products where list_id = new.list_id and id = new.product_id) as title) found;

  if v_mode = 'off' then
    select display_name into v_giver from public.givers where list_id = new.list_id and user_id = new.giver_id;
    if new.status = 'bought' then
      insert into public.push_outbox (user_id, list_id, title, body)
      values (v_list.owner_id, new.list_id, format('%s bought %s ✓', v_giver, v_what), 'One less to think about.');
    else
      insert into public.push_outbox (user_id, list_id, title, body)
      values (v_list.owner_id, new.list_id, format('%s is getting %s', v_giver, v_what), 'Held for 48 hours while they buy it.');
    end if;
  elsif v_mode = 'taken-care-of' and new.status = 'bought' then
    insert into public.push_outbox (user_id, list_id, title, body)
    values (v_list.owner_id, new.list_id, 'Another wish is taken care of ✓', 'We won''t say who.');
  end if;
  return new;
end;
$$;

create trigger claims_push after insert on public.claims
  for each row execute function public.queue_claim_push();
create trigger claims_bought_push after update of status on public.claims
  for each row when (new.status = 'bought' and old.status is distinct from 'bought')
  execute function public.queue_claim_push();

-- Sends what's queued to every phone the parent registered, through Expo's push service
-- (https://exp.host), using Supabase's pg_net. Returns how many messages went.
-- Old sent messages are tidied away after a week.
create function public.send_push_outbox() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_ids bigint[];
  v_messages jsonb;
begin
  select array_agg(o.id),
         jsonb_agg(jsonb_build_object('to', t.token, 'title', o.title, 'body', o.body, 'sound', 'default',
                                      'data', jsonb_build_object('listId', o.list_id)))
    into v_ids, v_messages
    from public.push_outbox o
    join public.push_tokens t on t.user_id = o.user_id
   where o.sent_at is null and o.created_at > now() - interval '1 day';

  if v_messages is not null then
    -- Expo takes up to 100 messages a request; a family list won't get near that in a minute.
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      body := v_messages,
      headers := '{"Content-Type": "application/json", "Accept": "application/json"}'::jsonb
    );
  end if;

  -- Mark everything due as handled, including messages for parents with no phone registered.
  update public.push_outbox set sent_at = now()
   where sent_at is null and (id = any (coalesce(v_ids, '{}')) or created_at <= now() - interval '1 day'
     or not exists (select 1 from public.push_tokens t where t.user_id = push_outbox.user_id));
  delete from public.push_outbox where sent_at < now() - interval '7 days';
  return coalesce(array_length(v_ids, 1), 0);
end;
$$;

revoke execute on function public.queue_claim_push() from public, anon, authenticated;
revoke execute on function public.send_push_outbox() from public, anon, authenticated;

-- Send every minute. Skipped quietly where pg_cron or pg_net isn't available (e.g. the
-- local test database).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron')
     and exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net;
    create extension if not exists pg_cron;
    perform cron.schedule('biro-send-push', '* * * * *', 'select public.send_push_outbox()');
  end if;
end;
$$;
