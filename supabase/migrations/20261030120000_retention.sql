-- Data retention, as promised in docs/legal/privacy-policy.md:
--   "Lists are deleted 12 months after the event date (for example 25 December), or
--    12 months after the list was last opened, whichever is later."
-- The app saves the list each time the parent opens it, which moves `updated_at` on,
-- so `updated_at` is when the list was last opened or changed.

-- When the list's occasion falls: Christmas Day after the list was made. Other occasions
-- don't have a date the app knows yet, so only "last opened" counts for them.
create function public.list_event_date(p_template text, p_created timestamptz) returns date
language sql immutable set search_path = '' as $$
  select case
    when p_template = 'christmas' then
      case when p_created::date <= make_date(extract(year from p_created)::int, 12, 25)
        then make_date(extract(year from p_created)::int, 12, 25)
        else make_date(extract(year from p_created)::int + 1, 12, 25)
      end
  end;
$$;

-- Deletes expired lists (and, by cascade, their circles, finds, givers, claims and pledges),
-- then anonymous sign-ins left with nothing: no lists of their own, not giving on any list,
-- and over 30 days old. Returns how many lists went.
create function public.purge_expired_lists() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_lists integer;
begin
  delete from public.lists l
   where greatest(
           l.updated_at,
           coalesce(public.list_event_date(l.settings ->> 'template', l.created_at)::timestamptz, l.updated_at)
         ) < now() - interval '12 months';
  get diagnostics v_lists = row_count;

  delete from auth.users u
   where u.is_anonymous
     and u.created_at < now() - interval '30 days'
     and not exists (select 1 from public.lists l where l.owner_id = u.id)
     and not exists (select 1 from public.givers g where g.user_id = u.id);

  return v_lists;
end;
$$;

-- Only the database itself runs this; nobody can call it through the API.
revoke execute on function public.purge_expired_lists() from public, anon, authenticated;
revoke execute on function public.list_event_date(text, timestamptz) from public, anon;

-- Run it every night at 03:17 (UK time is close enough), using Supabase's pg_cron.
-- Skipped quietly where pg_cron isn't available (e.g. the local test database).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('biro-purge-expired-lists', '17 3 * * *', 'select public.purge_expired_lists()');
  end if;
end;
$$;
