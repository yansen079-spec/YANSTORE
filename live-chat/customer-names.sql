-- Jalankan di Supabase SQL Editor untuk menyimpan nama pelanggan secara permanen.
create table if not exists public.yanstore_chat_customer_names(customer_id uuid primary key, nickname text not null check(char_length(nickname) between 1 and 40),updated_at timestamptz not null default now());
alter table public.yanstore_chat_customer_names enable row level security;
revoke all on public.yanstore_chat_customer_names from anon,authenticated;
grant select,insert,update on public.yanstore_chat_customer_names to authenticated;
drop policy if exists yanstore_names_admin_select on public.yanstore_chat_customer_names;
create policy yanstore_names_admin_select on public.yanstore_chat_customer_names for select to authenticated using ((select public.yanstore_is_chat_admin()));
drop policy if exists yanstore_names_admin_insert on public.yanstore_chat_customer_names;
create policy yanstore_names_admin_insert on public.yanstore_chat_customer_names for insert to authenticated with check ((select public.yanstore_is_chat_admin()));
drop policy if exists yanstore_names_admin_update on public.yanstore_chat_customer_names;
create policy yanstore_names_admin_update on public.yanstore_chat_customer_names for update to authenticated using ((select public.yanstore_is_chat_admin())) with check ((select public.yanstore_is_chat_admin()));
