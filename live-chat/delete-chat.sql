-- Run once in Supabase SQL Editor. Only server-verified chat admins can delete conversations.
create or replace function public.yanstore_admin_delete_chat(p_thread_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.yanstore_is_chat_admin() then
    raise exception 'Only chat admins may delete conversations' using errcode = '42501';
  end if;
  if not exists (select 1 from public.yanstore_chat_threads where id = p_thread_id) then
    return false;
  end if;
  delete from public.yanstore_chat_messages where thread_id = p_thread_id;
  delete from public.yanstore_chat_threads where id = p_thread_id;
  return true;
end;
$$;
revoke all on function public.yanstore_admin_delete_chat(uuid) from public, anon, authenticated;
grant execute on function public.yanstore_admin_delete_chat(uuid) to authenticated;
