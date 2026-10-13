-- YanStore Semi Auto Order: jalankan melalui Supabase SQL Editor.
-- Pembayaran TIDAK boleh diubah menjadi paid oleh browser pelanggan.
create table if not exists public.yanstore_orders (
 id uuid primary key default gen_random_uuid(),
 order_code text unique not null default ('YS-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
 customer_id uuid not null default auth.uid(),
 customer_contact text not null,
 items jsonb not null,
 total_amount bigint not null check (total_amount >= 0),
 payment_status text not null default 'pending' check(payment_status in ('pending','paid','failed','expired')),
 fulfillment_status text not null default 'waiting' check(fulfillment_status in ('waiting','processing','completed')),
 payment_provider text,
 payment_reference text unique,
 created_at timestamptz not null default now(),
 paid_at timestamptz,
 completed_at timestamptz
);
alter table public.yanstore_orders enable row level security;
revoke all on public.yanstore_orders from anon,authenticated;
grant select on public.yanstore_orders to authenticated;
-- Admin predicate already used by YanStore Live Chat.
create policy "yanstore_orders_owner_read" on public.yanstore_orders for select to authenticated using (customer_id = (select auth.uid()));
create policy "yanstore_orders_admin_read" on public.yanstore_orders for select to authenticated using ((select public.yanstore_is_chat_admin()));
-- IMPORTANT: do not create a customer INSERT/UPDATE policy. A server-side
-- Edge Function must validate cart SKUs/prices against products/product_variants,
-- create orders with service-role credentials, and initiate provider checkout.
-- Payment webhook must verify gateway signature, payment amount, currency,
-- order reference and status before updating payment_status to paid.
-- Fulfillment updates should be through an authenticated admin-only Edge Function.
