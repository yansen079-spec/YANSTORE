-- YanStore live chat schema. Review in a staging Supabase project before production.
-- Requires Supabase Auth; enable anonymous sign-ins for guest customers.
create table if not exists public.yanstore_chat_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists public.yanstore_chat_threads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'open' check (status in ('open','closed')),
  created_at timestamptz not null default now()
);
create index if not exists yanstore_chat_threads_customer_idx on public.yanstore_chat_threads(customer_id);
create table if not exists public.yanstore_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.yanstore_chat_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists yanstore_chat_messages_thread_time_idx on public.yanstore_chat_messages(thread_id,created_at);
create or replace function public.yanstore_is_chat_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.yanstore_chat_admins where user_id = (select auth.uid())); $$;
revoke all on function public.yanstore_is_chat_admin() from public;
grant execute on function public.yanstore_is_chat_admin() to authenticated;
alter table public.yanstore_chat_admins enable row level security;
alter table public.yanstore_chat_threads enable row level security;
alter table public.yanstore_chat_messages enable row level security;
revoke all on public.yanstore_chat_admins from anon, authenticated;
grant select, insert, update on public.yanstore_chat_threads to authenticated;
grant select, insert on public.yanstore_chat_messages to authenticated;
create policy "chat_threads_read" on public.yanstore_chat_threads for select to authenticated using (customer_id = (select auth.uid()) or (select public.yanstore_is_chat_admin()));
create policy "chat_threads_create" on public.yanstore_chat_threads for insert to authenticated with check (customer_id = (select auth.uid()) and status = 'open');
create policy "chat_threads_admin_update" on public.yanstore_chat_threads for update to authenticated using ((select public.yanstore_is_chat_admin())) with check ((select public.yanstore_is_chat_admin()));
create policy "chat_messages_read" on public.yanstore_chat_messages for select to authenticated using (exists (select 1 from public.yanstore_chat_threads t where t.id = thread_id and (t.customer_id = (select auth.uid()) or (select public.yanstore_is_chat_admin()))));
create policy "chat_messages_create" on public.yanstore_chat_messages for insert to authenticated with check (
  sender_id = (select auth.uid()) and exists (
    select 1 from public.yanstore_chat_threads t where t.id = thread_id and t.status = 'open'
      and (t.customer_id = (select auth.uid()) or (select public.yanstore_is_chat_admin()))
  )
);
-- Assign admin users only via trusted SQL editor after verifying auth.users ID:
-- insert into public.yanstore_chat_admins(user_id) values ('REPLACE_WITH_AUTH_USER_UUID');
-- Never expose service_role keys or admin assignment in browser JavaScript.
