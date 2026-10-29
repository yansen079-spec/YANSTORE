-- Run once in Supabase SQL Editor before merging Price Manager V1
create table if not exists public.digital_prices (
 id bigint generated always as identity primary key,
 service text not null check (service in ('pulsa','data','ewallet','pln','games','voucher','tv','telepon','masaaktif','gas','perdana')),
 item_name text not null,
 provider text not null default '',
 cost integer not null default 0 check(cost>=0),
 sale_price integer not null check(sale_price>=0),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(service,provider,item_name)
);
alter table public.digital_prices enable row level security;
revoke all on table public.digital_prices from anon;
grant select,insert,update,delete on public.digital_prices to authenticated;
grant usage,select on sequence public.digital_prices_id_seq to authenticated;
drop policy if exists "yanstore_admin_prices_all" on public.digital_prices;
create policy "yanstore_admin_prices_all" on public.digital_prices for all to authenticated
using ((auth.jwt()->>'email')='yanstore2023@gmail.com')
with check ((auth.jwt()->>'email')='yanstore2023@gmail.com');
-- Public catalog only sees sell prices, never purchase cost.
create or replace function public.yanstore_public_prices()
returns table(id bigint, service text, item_name text, provider text, sale_price integer)
language sql stable security definer set search_path=public as $$
 select p.id,p.service,p.item_name,p.provider,p.sale_price from public.digital_prices p where p.active=true order by p.service,p.provider,p.sale_price;
$$;
revoke all on function public.yanstore_public_prices() from public;
grant execute on function public.yanstore_public_prices() to anon,authenticated;
