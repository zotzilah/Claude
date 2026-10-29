-- Security and rules tests for the Biro schema. Each block signs in as someone and checks
-- what they can and can't do. Any failed check stops the run with a message.
-- Run with supabase/tests/run.sh (needs a local PostgreSQL 15+).

\set ON_ERROR_STOP 1
\set QUIET 1

create schema tests;
grant usage on schema tests to anon, authenticated;

create function tests.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user)::text, false);
$$;

create function tests.eq(actual anyelement, expected anyelement, label text) returns void
language plpgsql as $$
begin
  if actual is distinct from expected then
    raise exception 'FAILED: % (expected %, got %)', label, expected, actual;
  end if;
  raise notice 'ok - %', label;
end;
$$;

-- Runs a statement as the current role and checks it fails with a message containing `expected`.
create function tests.fails(statement text, expected text, label text) returns void
language plpgsql as $$
begin
  execute statement;
  raise exception 'FAILED: % (expected an error containing "%", but it succeeded)', label, expected;
exception
  when others then
    if sqlerrm like 'FAILED:%' then raise; end if;
    if position(expected in sqlerrm) = 0 then
      raise exception 'FAILED: % (expected "%", got "%")', label, expected, sqlerrm;
    end if;
    raise notice 'ok - %', label;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

-- The cast: a parent who owns the list, two family givers and a stranger.
insert into auth.users (id, is_anonymous) values
  ('00000000-0000-0000-0000-00000000000a', false), -- Sam, the parent
  ('00000000-0000-0000-0000-00000000000b', true),  -- Nan, via the share link
  ('00000000-0000-0000-0000-00000000000c', true),  -- Dave, via the share link
  ('00000000-0000-0000-0000-00000000000d', false); -- a stranger with an account

-- ---------- The parent sets up a list and circles things ----------
set role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000a');

insert into public.lists (id, title, settings)
values ('10000000-0000-0000-0000-000000000001', 'Ellie''s Christmas Book 2026', '{"surpriseMode": "taken-care-of"}');
insert into public.circle_marks (list_id, product_id, stars) values
  ('10000000-0000-0000-0000-000000000001', 'p2', 3),
  ('10000000-0000-0000-0000-000000000001', 'p13', 2),
  ('10000000-0000-0000-0000-000000000001', 'p16', 1);
insert into public.custom_products (list_id, id, title, price_minor, currency, retailer, url)
values ('10000000-0000-0000-0000-000000000001', 'custom-1', 'Glitter Unicorn Lamp', 2499, 'GBP', 'Sparkle Toys', 'https://toys.example/lamp');

select tests.eq((select owner_id from public.lists), '00000000-0000-0000-0000-00000000000a'::uuid, 'a new list belongs to whoever made it');
select tests.eq((select char_length(share_token) from public.lists), 32, 'share links get a long random token');
select tests.fails($$insert into public.lists (title, owner_id) values ('Hijack', '00000000-0000-0000-0000-00000000000d')$$,
  'row-level security', 'nobody can create a list in someone else''s name');
select tests.fails($$insert into public.custom_products (list_id, id, title, price_minor, currency, url)
  values ('10000000-0000-0000-0000-000000000001', 'x', 'Bad', 100, 'GBP', 'javascript:alert(1)')$$,
  'check constraint', 'found products must link to a web page');
select tests.fails($$select public.join_list((select share_token from public.lists), 'Mum')$$,
  'owner-cannot-give', 'the owner can''t join their own list as a giver to peek at claims');

-- Keep the token for the givers (as the superuser, outside the API).
reset role;
select share_token as token from public.lists \gset

-- ---------- A stranger sees nothing ----------
set role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000d');
select tests.eq((select count(*) from public.lists)::int, 0, 'a stranger can''t see the list');
select tests.eq((select count(*) from public.circle_marks)::int, 0, 'a stranger can''t see the circles');
select tests.fails($$select public.claim_item('10000000-0000-0000-0000-000000000001', 'p2')$$,
  'not-a-giver', 'a stranger can''t claim without the share link');
select tests.fails($$select public.join_list('not-the-real-token', 'Sneaky')$$,
  'list-not-found', 'a guessed share link doesn''t work');

-- ---------- Nan joins through the link and claims the dino kit ----------
select tests.login('00000000-0000-0000-0000-00000000000b');
select tests.eq(public.join_list(:'token', '  Nan '), '10000000-0000-0000-0000-000000000001'::uuid, 'Nan joins with the share link');
select tests.eq((select display_name from public.givers where user_id = auth.uid()), 'Nan', 'names are tidied');
select tests.eq((select count(*) from public.circle_marks)::int, 3, 'givers see the circled wishes');
select tests.eq((select title from public.custom_products), 'Glitter Unicorn Lamp', 'givers see found products');
select tests.fails($$insert into public.circle_marks (list_id, product_id, stars) values ('10000000-0000-0000-0000-000000000001', 'p99', 3)$$,
  'row-level security', 'givers can''t add wishes');
-- RLS hides rows a giver may not change, so an update quietly changes nothing.
update public.circle_marks set stars = 1;
reset role;
select tests.eq((select stars from public.circle_marks where product_id = 'p2')::int, 3, 'givers can''t change stars');
set role authenticated;
select tests.fails($$insert into public.claims (list_id, product_id, giver_id, status, held_until)
  values ('10000000-0000-0000-0000-000000000001', 'p13', auth.uid(), 'bought', now())$$,
  'permission denied', 'claims can only be made through the rules');

select tests.eq((select status from public.claim_item('10000000-0000-0000-0000-000000000001', 'p2')), 'held', 'Nan claims the dino kit');
select tests.eq((select round(extract(epoch from held_until - claimed_at) / 3600) from public.claims where product_id = 'p2')::int, 48, 'the hold lasts 48 hours');
select tests.fails($$select public.claim_item('10000000-0000-0000-0000-000000000001', 'p999')$$,
  'not-on-list', 'you can only claim things that are on the list');

-- ---------- Dave joins and tries his luck ----------
select tests.login('00000000-0000-0000-0000-00000000000c');
select tests.fails(format($$select public.join_list(%L, 'Nan')$$, :'token'), 'name-taken', 'two people can''t both be "Nan"');
select tests.eq(public.join_list(:'token', 'Dave'), '10000000-0000-0000-0000-000000000001'::uuid, 'Dave joins');
select tests.eq((select g.display_name from public.claims c join public.givers g on g.user_id = c.giver_id and g.list_id = c.list_id), 'Nan',
  'givers can see who claimed what');
select tests.fails($$select public.claim_item('10000000-0000-0000-0000-000000000001', 'p2')$$,
  'already-claimed', 'Dave can''t claim what Nan has claimed');
select tests.fails($$select public.mark_bought('10000000-0000-0000-0000-000000000001', 'p2')$$,
  'not-yours', 'Dave can''t mark Nan''s claim as bought');
select tests.fails($$select public.release_claim('10000000-0000-0000-0000-000000000001', 'p2')$$,
  'not-yours', 'Dave can''t release Nan''s claim');

-- Group gift on the bike: Dave organises, both pledge.
select public.start_group_gift('10000000-0000-0000-0000-000000000001', 'p13');
select public.pledge('10000000-0000-0000-0000-000000000001', 'p13', 5000);
select tests.fails($$select public.pledge('10000000-0000-0000-0000-000000000001', 'p13', -5)$$, 'bad-amount', 'negative pledges are refused');
select tests.fails($$select public.pledge('10000000-0000-0000-0000-000000000001', 'p16', 500)$$, 'no-group-gift', 'you can only pledge to a group gift');

select tests.login('00000000-0000-0000-0000-00000000000b');
select public.start_group_gift('10000000-0000-0000-0000-000000000001', 'p13');
select tests.eq((select g.display_name from public.group_gifts gg join public.givers g on g.user_id = gg.organiser_id and g.list_id = gg.list_id), 'Dave',
  'starting a group gift twice keeps the first organiser');
select public.pledge('10000000-0000-0000-0000-000000000001', 'p13', 2500);
select public.pledge('10000000-0000-0000-0000-000000000001', 'p13', 3000);
select tests.eq((select sum(amount_minor) from public.pledges)::int, 8000, 'pledging again replaces your pledge');
select public.pledge('10000000-0000-0000-0000-000000000001', 'p13', 0);
select tests.eq((select sum(amount_minor) from public.pledges)::int, 5000, 'pledging 0 withdraws it');

select tests.eq((select status from public.mark_bought('10000000-0000-0000-0000-000000000001', 'p2')), 'bought', 'Nan marks the dino kit bought');

-- ---------- Surprise mode: the parent can't see who bought what ----------
select tests.login('00000000-0000-0000-0000-00000000000a');
select tests.eq((select count(*) from public.claims)::int, 0, 'the owner can''t read claims');
select tests.eq((select count(*) from public.pledges)::int, 0, 'the owner can''t read pledges');
select tests.eq((select count(*) from public.givers)::int, 0, 'the owner can''t see who the givers are');
select tests.eq((select array_agg(p order by p) from public.covered_products('10000000-0000-0000-0000-000000000001') p), array['p2'],
  'the owner sees only that the dino kit is "taken care of"');
update public.lists set settings = settings || '{"surpriseMode": "hide-all"}';
select tests.eq((select count(*) from public.covered_products('10000000-0000-0000-0000-000000000001'))::int, 0,
  'with "hide everything", the owner sees nothing at all');

select tests.login('00000000-0000-0000-0000-00000000000d');
select tests.eq((select count(*) from public.covered_products('10000000-0000-0000-0000-000000000001'))::int, 0,
  'a stranger learns nothing from covered_products');

-- ---------- Expired holds ----------
select tests.login('00000000-0000-0000-0000-00000000000c');
select public.claim_item('10000000-0000-0000-0000-000000000001', 'p16');
reset role;
update public.claims set claimed_at = now() - interval '49 hours', held_until = now() - interval '1 hour' where product_id = 'p16';
set role authenticated;
select tests.fails($$select public.mark_bought('10000000-0000-0000-0000-000000000001', 'p16')$$,
  'not-claimed', 'an expired hold can''t be marked bought');
select tests.login('00000000-0000-0000-0000-00000000000b');
select tests.eq((select giver_id from public.claim_item('10000000-0000-0000-0000-000000000001', 'p16')), '00000000-0000-0000-0000-00000000000b'::uuid,
  'after 48 hours someone else can claim it');

-- ---------- Surprise off (the default): the owner sees the buying side and can claim ----------
reset role;
update public.lists set settings = settings - 'surpriseMode'; -- no setting means surprise is off
set role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000a');
select tests.eq((select count(*) from public.claims)::int, 2, 'with surprise off, the owner can read claims');
select tests.eq((select count(*) from public.givers)::int, 2, 'with surprise off, the owner sees who the givers are');
select tests.eq(public.join_list(:'token', 'Mum'), '10000000-0000-0000-0000-000000000001'::uuid, 'with surprise off, the owner can join as a giver');
select tests.eq((select status from public.claim_item('10000000-0000-0000-0000-000000000001', 'p13')), 'held', 'and claim a gift herself');

-- Turning surprise back on shuts the door, even though she has already joined as a giver.
update public.lists set settings = settings || '{"surpriseMode": "taken-care-of"}';
select tests.eq((select count(*) from public.claims)::int, 0, 'surprise back on: the owner can''t read claims again');
select tests.eq((select count(*) from public.givers)::int, 0, 'surprise back on: the owner can''t see givers again');
select tests.fails($$select public.release_claim('10000000-0000-0000-0000-000000000001', 'p13')$$,
  'not-a-giver', 'surprise back on: the owner can''t act as a giver');
select tests.eq((select count(*) from public.covered_products('10000000-0000-0000-0000-000000000001'))::int, 3,
  'surprise back on: the owner still sees "taken care of"');

-- ---------- The waitlist ----------
reset role;
set role anon;
select set_config('request.jwt.claims', '', false);
insert into public.waitlist (email, first_name, age_bands, country, source) values ('sam@example.com', 'Sam', array['6-8'], 'GB', 'tests');
select tests.fails($$select * from public.waitlist$$, 'permission denied', 'nobody can read the waitlist from outside');
select tests.fails($$insert into public.waitlist (email) values ('sam@example.com')$$, 'duplicate key', 'signing up twice is caught');
select tests.fails($$insert into public.waitlist (email) values ('not an email')$$, 'check constraint', 'junk emails are refused');
select tests.fails($$insert into public.waitlist (email, age_bands) values ('a@b.example', array['old'])$$, 'check constraint', 'only known age bands');
select tests.fails($$select * from public.lists$$, 'permission denied', 'signed-out visitors can''t read lists');
select tests.fails($$select public.join_list('x', 'y')$$, 'permission denied', 'signed-out visitors can''t call the giver functions');

reset role;
select 'ALL RULE TESTS PASSED' as result;
