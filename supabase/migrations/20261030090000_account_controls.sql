-- Account controls promised in docs/legal/privacy-policy.md:
--   * "You can make a new link at any time, which stops the old one working."
--   * "You can delete your account and every list from Settings."

-- Replaces a list's share link. Givers who already joined keep access; nobody new can
-- join with the old link. Only the list's owner can do this.
create function public.new_share_token(p_list uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_token text := encode(extensions.gen_random_bytes(16), 'hex');
begin
  update public.lists set share_token = v_token, updated_at = now()
   where id = p_list and owner_id = auth.uid();
  if not found then raise exception 'not-your-list'; end if;
  return v_token;
end;
$$;

-- Deletes the signed-in person's account. Every list they own, and everything on
-- those lists, goes with it (on delete cascade). So do their claims and pledges on
-- other people's lists.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not-signed-in'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.new_share_token(uuid), public.delete_my_account() from public, anon;
grant execute on function public.new_share_token(uuid), public.delete_my_account() to authenticated;
