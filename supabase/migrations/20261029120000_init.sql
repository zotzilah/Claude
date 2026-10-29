-- Project Biro: initial schema.
--
-- Who can do what (enforced here, not just in the app):
--   * Owners (parents, signed in) read and change their own lists, circles and found products.
--   * Givers join a list through its share link, usually as anonymous Supabase users (no account).
--     They read the wishes, and change claims and pledges ONLY through the functions below,
--     which apply the same rules as mobile/src/domain/claims.ts.
--   * Surprise mode: owners can never read claims, givers or pledges. covered_products()
--     tells them, at most, which items are "taken care of", and nothing if they chose to hide it.
--   * The waitlist accepts sign-ups from anyone and can't be read from outside.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  -- The ListSettings object from the app (template, circler, buyers, budget, surprise mode…).
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  -- The secret in the Giver link. Long and random, so links can't be guessed.
  share_token text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.circle_marks (
  list_id uuid not null references public.lists (id) on delete cascade,
  product_id text not null check (char_length(product_id) between 1 and 80),
  stars smallint not null check (stars between 1 and 3),
  circled_at timestamptz not null default now(),
  primary key (list_id, product_id)
);

-- Products a family added by pasting a link. Private to their list.
create table public.custom_products (
  list_id uuid not null references public.lists (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 80),
  title text not null check (char_length(title) between 1 and 120),
  price_minor integer not null check (price_minor >= 0),
  currency char(3) not null,
  retailer text not null default '' check (char_length(retailer) <= 60),
  url text not null check (url ~ '^https?://' and char_length(url) <= 2000),
  image_url text check (image_url is null or (image_url ~ '^https?://' and char_length(image_url) <= 2000)),
  created_at timestamptz not null default now(),
  primary key (list_id, id)
);

create table public.givers (
  list_id uuid not null references public.lists (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 30),
  joined_at timestamptz not null default now(),
  primary key (list_id, user_id),
  -- Two people can't both be "Nan" on one list, or claims would be ambiguous.
  unique (list_id, display_name)
);

create table public.claims (
  list_id uuid not null,
  product_id text not null,
  giver_id uuid not null,
  status text not null check (status in ('held', 'bought')),
  claimed_at timestamptz not null default now(),
  held_until timestamptz not null,
  -- One claim per wish. Expired holds are cleared by claim_item() before a new claim.
  primary key (list_id, product_id),
  foreign key (list_id, product_id) references public.circle_marks (list_id, product_id) on delete cascade,
  foreign key (list_id, giver_id) references public.givers (list_id, user_id) on delete cascade
);

create table public.group_gifts (
  list_id uuid not null,
  product_id text not null,
  organiser_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (list_id, product_id),
  foreign key (list_id, product_id) references public.circle_marks (list_id, product_id) on delete cascade,
  foreign key (list_id, organiser_id) references public.givers (list_id, user_id) on delete cascade
);

create table public.pledges (
  list_id uuid not null,
  product_id text not null,
  giver_id uuid not null,
  amount_minor integer not null check (amount_minor > 0 and amount_minor <= 10000000),
  pledged_at timestamptz not null default now(),
  -- One pledge per person per gift: pledging again replaces it.
  primary key (list_id, product_id, giver_id),
  foreign key (list_id, product_id) references public.group_gifts (list_id, product_id) on delete cascade,
  foreign key (list_id, giver_id) references public.givers (list_id, user_id) on delete cascade
);

create table public.waitlist (
  id bigint generated always as identity primary key,
  email text not null unique check (char_length(email) <= 200 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  first_name text check (first_name is null or char_length(first_name) <= 40),
  age_bands text[] not null default '{}' check (age_bands <@ array['3-5', '6-8', '9-12', 'adult']),
  country text not null default '' check (char_length(country) <= 10),
  source text not null default '' check (char_length(source) <= 100),
  created_at timestamptz not null default now()
);

create index claims_giver_idx on public.claims (list_id, giver_id);
create index givers_user_idx on public.givers (user_id);
create index lists_owner_idx on public.lists (owner_id);

-- ---------------------------------------------------------------------------
-- Helpers (security definer so policies can use them without recursion)
-- ---------------------------------------------------------------------------

create function public.is_list_owner(p_list uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.lists where id = p_list and owner_id = auth.uid());
$$;

create function public.is_list_giver(p_list uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.givers where list_id = p_list and user_id = auth.uid());
$$;

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger lists_touch before update on public.lists
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.lists enable row level security;
alter table public.circle_marks enable row level security;
alter table public.custom_products enable row level security;
alter table public.givers enable row level security;
alter table public.claims enable row level security;
alter table public.group_gifts enable row level security;
alter table public.pledges enable row level security;
alter table public.waitlist enable row level security;

-- Lists: owners do everything; givers can read the list they joined.
create policy lists_owner_all on public.lists for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy lists_giver_read on public.lists for select to authenticated
  using (public.is_list_giver(id));

-- Circles and found products: owners write; givers read.
create policy marks_owner_all on public.circle_marks for all to authenticated
  using (public.is_list_owner(list_id)) with check (public.is_list_owner(list_id));
create policy marks_giver_read on public.circle_marks for select to authenticated
  using (public.is_list_giver(list_id));

create policy products_owner_all on public.custom_products for all to authenticated
  using (public.is_list_owner(list_id)) with check (public.is_list_owner(list_id));
create policy products_giver_read on public.custom_products for select to authenticated
  using (public.is_list_giver(list_id));

-- Givers see each other (names on claims); nobody else does, owners included.
-- Joining goes through join_list(); leaving deletes your own row.
create policy givers_read on public.givers for select to authenticated
  using (public.is_list_giver(list_id));
create policy givers_leave on public.givers for delete to authenticated
  using (user_id = auth.uid());

-- Claims, group gifts and pledges: givers of the list may read; all writes go through
-- the functions below. There is deliberately no owner policy: that's surprise mode.
create policy claims_giver_read on public.claims for select to authenticated
  using (public.is_list_giver(list_id));
create policy group_gifts_giver_read on public.group_gifts for select to authenticated
  using (public.is_list_giver(list_id));
create policy pledges_giver_read on public.pledges for select to authenticated
  using (public.is_list_giver(list_id));

-- Waitlist: anyone may add themselves; nobody may read it through the API.
create policy waitlist_signup on public.waitlist for insert to anon, authenticated
  with check (true);

-- Table privileges. Supabase grants everything to anon/authenticated by default and relies
-- on RLS; we narrow it so a missing policy can never become a leak.
revoke all on public.lists, public.circle_marks, public.custom_products, public.givers,
  public.claims, public.group_gifts, public.pledges, public.waitlist from anon, authenticated;
grant select, insert, update, delete on public.lists, public.circle_marks, public.custom_products to authenticated;
grant select, delete on public.givers to authenticated;
grant select on public.claims, public.group_gifts, public.pledges to authenticated;
grant insert on public.waitlist to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Giver actions (the only way to change claims and pledges)
-- Errors are raised with a short code as the message, e.g. 'already-claimed',
-- matching ClaimError in mobile/src/domain/claims.ts.
-- ---------------------------------------------------------------------------

create function public.join_list(p_share_token text, p_display_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_list uuid;
  v_owner uuid;
  v_name text := btrim(p_display_name);
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  select id, owner_id into v_list, v_owner from public.lists where share_token = p_share_token;
  if v_list is null then raise exception 'list-not-found'; end if;
  -- Surprise mode: the list owner can't join as a giver to peek at claims.
  if v_owner = auth.uid() then raise exception 'owner-cannot-give'; end if;
  insert into public.givers (list_id, user_id, display_name) values (v_list, auth.uid(), v_name)
  on conflict (list_id, user_id) do update set display_name = excluded.display_name;
  return v_list;
exception
  when unique_violation then raise exception 'name-taken';
end;
$$;

create function public.claim_item(p_list uuid, p_product text) returns public.claims
language plpgsql security definer set search_path = '' as $$
declare
  v_claim public.claims;
begin
  if not public.is_list_giver(p_list) then raise exception 'not-a-giver'; end if;
  if not exists (select 1 from public.circle_marks where list_id = p_list and product_id = p_product) then
    raise exception 'not-on-list';
  end if;
  -- An expired hold is as good as no claim.
  delete from public.claims
   where list_id = p_list and product_id = p_product and status = 'held' and held_until <= now();
  insert into public.claims (list_id, product_id, giver_id, status, held_until)
  values (p_list, p_product, auth.uid(), 'held', now() + interval '48 hours')
  returning * into v_claim;
  return v_claim;
exception
  when unique_violation then raise exception 'already-claimed';
end;
$$;

create function public.mark_bought(p_list uuid, p_product text) returns public.claims
language plpgsql security definer set search_path = '' as $$
declare
  v_claim public.claims;
begin
  select * into v_claim from public.claims
   where list_id = p_list and product_id = p_product
     and (status = 'bought' or held_until > now());
  if v_claim is null then raise exception 'not-claimed'; end if;
  if v_claim.giver_id <> auth.uid() then raise exception 'not-yours'; end if;
  update public.claims set status = 'bought'
   where list_id = p_list and product_id = p_product
  returning * into v_claim;
  return v_claim;
end;
$$;

create function public.release_claim(p_list uuid, p_product text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_giver uuid;
begin
  select giver_id into v_giver from public.claims
   where list_id = p_list and product_id = p_product
     and (status = 'bought' or held_until > now());
  if v_giver is null then raise exception 'not-claimed'; end if;
  if v_giver <> auth.uid() then raise exception 'not-yours'; end if;
  delete from public.claims where list_id = p_list and product_id = p_product;
end;
$$;

create function public.start_group_gift(p_list uuid, p_product text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_list_giver(p_list) then raise exception 'not-a-giver'; end if;
  if not exists (select 1 from public.circle_marks where list_id = p_list and product_id = p_product) then
    raise exception 'not-on-list';
  end if;
  -- Starting it twice keeps the original organiser.
  insert into public.group_gifts (list_id, product_id, organiser_id)
  values (p_list, p_product, auth.uid())
  on conflict do nothing;
end;
$$;

-- Pledging again replaces your pledge; pledging 0 withdraws it. Biro never handles money.
create function public.pledge(p_list uuid, p_product text, p_amount_minor integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_list_giver(p_list) then raise exception 'not-a-giver'; end if;
  if not exists (select 1 from public.group_gifts where list_id = p_list and product_id = p_product) then
    raise exception 'no-group-gift';
  end if;
  if p_amount_minor is null or p_amount_minor < 0 then raise exception 'bad-amount'; end if;
  if p_amount_minor = 0 then
    delete from public.pledges where list_id = p_list and product_id = p_product and giver_id = auth.uid();
  else
    insert into public.pledges (list_id, product_id, giver_id, amount_minor)
    values (p_list, p_product, auth.uid(), p_amount_minor)
    on conflict (list_id, product_id, giver_id)
    do update set amount_minor = excluded.amount_minor, pledged_at = now();
  end if;
end;
$$;

-- What the list owner may know (brief §7.3): which wishes are "taken care of", never who.
-- Returns nothing at all when the owner chose to hide everything.
create function public.covered_products(p_list uuid) returns setof text
language sql stable security definer set search_path = '' as $$
  select c.product_id
    from public.claims c
    join public.lists l on l.id = c.list_id
   where c.list_id = p_list
     and l.owner_id = auth.uid()
     and coalesce(l.settings ->> 'surpriseMode', 'taken-care-of') = 'taken-care-of'
     and (c.status = 'bought' or c.held_until > now());
$$;

-- Functions are executable by PUBLIC by default; only signed-in users may call these.
revoke execute on function
  public.is_list_owner(uuid), public.is_list_giver(uuid), public.join_list(text, text),
  public.claim_item(uuid, text), public.mark_bought(uuid, text), public.release_claim(uuid, text),
  public.start_group_gift(uuid, text), public.pledge(uuid, text, integer), public.covered_products(uuid)
  from public, anon;
grant execute on function
  public.is_list_owner(uuid), public.is_list_giver(uuid), public.join_list(text, text),
  public.claim_item(uuid, text), public.mark_bought(uuid, text), public.release_claim(uuid, text),
  public.start_group_gift(uuid, text), public.pledge(uuid, text, integer), public.covered_products(uuid)
  to authenticated;

-- Live updates for the app (claims appearing on everyone's phone straight away).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.circle_marks, public.custom_products,
      public.claims, public.group_gifts, public.pledges;
  end if;
end;
$$;
