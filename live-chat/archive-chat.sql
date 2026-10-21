-- Run once in Supabase SQL Editor. Archiving never deletes messages.
create table if not exists public.yanstore_chat_archives (
 thread_id uuid primary key references public.yanstore_chat_threads(id) on delete cascade,
 archived_at timestamptz not null default now(),
 archived_by uuid references auth.users(id) on delete set null
);
alter table public.yanstore_chat_archives enable row level security;
revoke all on public.yanstore_chat_archives from anon,authenticated;
grant select on public.yanstore_chat_archives to authenticated;
drop policy if exists yanstore_chat_archives_admin_select on public.yanstore_chat_archives;
create policy yanstore_chat_archives_admin_select on public.yanstore_chat_archives
 for select to authenticated using ((select public.yanstore_is_chat_admin()));
create or replace function public.yanstore_admin_set_chat_archive(p_thread_id uuid,p_archived boolean)
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
 if auth.uid() is null or not public.yanstore_is_chat_admin() then
  raise exception 'Only chat admins may archive conversations' using errcode='42501';
 end if;
 if not exists(select 1 from public.yanstore_chat_threads where id=p_thread_id) then return false; end if;
 if p_archived then
  insert into public.yanstore_chat_archives(thread_id,archived_by)
  values(p_thread_id,auth.uid())
  on conflict(thread_id) do update set archived_at=now(),archived_by=excluded.archived_by;
 else
  delete from public.yanstore_chat_archives where thread_id=p_thread_id;
 end if;
 return true;
end;
$$;
revoke all on function public.yanstore_admin_set_chat_archive(uuid,boolean) from public,anon,authenticated;
grant execute on function public.yanstore_admin_set_chat_archive(uuid,boolean) to authenticated;
notify pgrst,'reload schema';
