-- Run once in Supabase SQL Editor. Admin presence is server-verified.
create table if not exists public.yanstore_chat_presence (
  admin_id uuid primary key references auth.users(id) on delete cascade,
  last_seen timestamptz not null default now()
);
alter table public.yanstore_chat_presence enable row level security;
revoke all on public.yanstore_chat_presence from anon, authenticated;

create or replace function public.yanstore_chat_heartbeat()
returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.yanstore_is_chat_admin() then
    return false;
  end if;
  insert into public.yanstore_chat_presence (admin_id,last_seen)
  values (auth.uid(), now())
  on conflict (admin_id) do update set last_seen=excluded.last_seen;
  return true;
end;
$$;

create or replace function public.yanstore_chat_online()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.yanstore_chat_presence p
    join public.yanstore_chat_admins a on a.user_id=p.admin_id
    where p.last_seen > now() - interval '90 seconds'
  );
$$;

revoke all on function public.yanstore_chat_heartbeat() from public, anon, authenticated;
grant execute on function public.yanstore_chat_heartbeat() to authenticated;
revoke all on function public.yanstore_chat_online() from public, anon, authenticated;
grant execute on function public.yanstore_chat_online() to anon, authenticated;
