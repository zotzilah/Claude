-- Backup codes: moving a list to a new phone without an email account.
--
-- Lists belong to the phone's anonymous sign-in, so a parent who loses or replaces their
-- phone would lose the list. The parent can make a backup code (Settings → Account) and,
-- on the new phone, type it in to move the list across: circles, found products, settings,
-- the family link, and everything the family has claimed.
--
-- The code is 16 characters from an alphabet without look-alikes (no 0/O, 1/I/L), about 79
-- bits, so it can't be guessed. Only a SHA-256 hash is stored, so a database leak doesn't
-- leak working codes. Making a new code retires the old one.

create table public.list_backup_codes (
  list_id uuid primary key references public.lists (id) on delete cascade,
  code_hash text not null unique,
  created_at timestamptz not null default now()
);

alter table public.list_backup_codes enable row level security;
-- No policies and no grants: only the two functions below touch it.
revoke all on public.list_backup_codes from anon, authenticated;

-- Upper-case letters and digits only, so "k7pm-qx4r…" and "K7PM QX4R…" are the same code.
create function public.normalise_backup_code(p_code text) returns text
language sql immutable set search_path = '' as $$
  select regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
$$;

-- Makes (or replaces) the list's backup code and returns it, e.g. 'K7PM-QX4R-9DWN-H3TB'.
-- Only the owner can.
create function public.new_backup_code(p_list uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_bytes bytea := extensions.gen_random_bytes(16);
  v_code text := '';
begin
  if not public.is_list_owner(p_list) then raise exception 'not-your-list'; end if;
  for i in 0..15 loop
    v_code := v_code || substr(v_alphabet, 1 + get_byte(v_bytes, i) % length(v_alphabet), 1);
  end loop;
  insert into public.list_backup_codes (list_id, code_hash)
  values (p_list, encode(extensions.digest(v_code, 'sha256'), 'hex'))
  on conflict (list_id) do update set code_hash = excluded.code_hash, created_at = now();
  return substr(v_code, 1, 4) || '-' || substr(v_code, 5, 4) || '-' || substr(v_code, 9, 4) || '-' || substr(v_code, 13, 4);
end;
$$;

-- Moves the list with this code to the signed-in phone, and returns its id.
-- The old phone keeps its copy on the phone, but can no longer change the list online.
create function public.restore_with_backup_code(p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_list uuid;
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  select list_id into v_list from public.list_backup_codes
   where code_hash = encode(extensions.digest(public.normalise_backup_code(p_code), 'sha256'), 'hex');
  if v_list is null then raise exception 'bad-backup-code'; end if;
  -- An owner can't also be one of the list's givers.
  delete from public.givers where list_id = v_list and user_id = auth.uid();
  update public.lists set owner_id = auth.uid(), updated_at = now() where id = v_list;
  return v_list;
end;
$$;

revoke execute on function public.new_backup_code(uuid), public.restore_with_backup_code(text) from public, anon;
grant execute on function public.new_backup_code(uuid), public.restore_with_backup_code(text) to authenticated;
