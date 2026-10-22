-- YanStore order approval and automatic inventory allocation (Supabase SQL Editor)
-- Run once in the same Supabase project used by the storefront.
create extension if not exists pgcrypto;

create table if not exists public.ys_inventory (
 id uuid primary key default gen_random_uuid(),
 product_id bigint not null,
 variant_label text not null default '',
 delivery_text text not null,
 state text not null default 'available' check (state in ('available','delivered','disabled')),
 order_id uuid unique,
 created_at timestamptz not null default now()
);
create index if not exists ys_inventory_lookup on public.ys_inventory(product_id,variant_label,state);
create table if not exists public.ys_orders (
 id uuid primary key default gen_random_uuid(),
 lookup_token uuid not null default gen_random_uuid() unique,
 product_id bigint not null,
 product_name text not null,
 variant_label text not null default '',
 amount integer not null check(amount>0),
 buyer_contact text not null,
 fulfillment_mode text not null default 'stock' check (fulfillment_mode in ('stock','manual','invite')),
 state text not null default 'pending' check(state in ('pending','approved','fulfilled','awaiting_stock','rejected')),
 created_at timestamptz not null default now(),
 approved_at timestamptz
);
alter table public.ys_inventory add constraint ys_inventory_order_fk foreign key (order_id) references public.ys_orders(id);
alter table public.ys_inventory enable row level security;
alter table public.ys_orders enable row level security;
revoke all on public.ys_inventory from anon, authenticated;
revoke all on public.ys_orders from anon, authenticated;

-- Replace this email only if your YanStore admin account changes.
create or replace function public.ys_is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists (
 select 1 from auth.users u where u.id=auth.uid() and lower(u.email)=lower('yanstore2023@gmail.com')
 );
$$;
revoke all on function public.ys_is_admin() from public;
grant execute on function public.ys_is_admin() to authenticated;

create or replace function public.ys_create_order(
 p_product_id bigint,p_variant text,p_contact text,p_mode text default 'stock'
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare p record; o public.ys_orders; amount_value integer;
begin
 if length(trim(coalesce(p_contact,'')))<5 or length(p_contact)>250 then raise exception 'Kontak pembeli tidak valid'; end if;
 if p_mode not in ('stock','manual','invite') then raise exception 'Jenis pemenuhan tidak valid'; end if;
 select id,name,price,active into p from public.products where id=p_product_id and active=true;
 if not found then raise exception 'Produk tidak tersedia'; end if;
 -- Price must be calculated server-side, never accepted from buyer input.
 -- Until per-variant pricing is modeled in a trusted table, reject orders here.
 raise exception 'Checkout belum aktif: konfigurasi harga varian di server diperlukan';
end; $$;
revoke all on function public.ys_create_order(bigint,text,text,text) from public;
grant execute on function public.ys_create_order(bigint,text,text,text) to anon,authenticated;

create or replace function public.ys_add_stock(p_product_id bigint,p_variant text,p_delivery_text text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
 if not public.ys_is_admin() then raise exception 'Admin only'; end if;
 if length(trim(coalesce(p_delivery_text,'')))<3 then raise exception 'Stok kosong'; end if;
 insert into public.ys_inventory(product_id,variant_label,delivery_text)
 values(p_product_id,trim(coalesce(p_variant,'')),p_delivery_text) returning id into new_id;
 return new_id;
end; $$;
revoke all on function public.ys_add_stock(bigint,text,text) from public;
grant execute on function public.ys_add_stock(bigint,text,text) to authenticated;

create or replace function public.ys_admin_orders()
returns table(id uuid,product_name text,variant_label text,buyer_contact text,amount integer,state text,created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
 if not public.ys_is_admin() then raise exception 'Admin only'; end if;
 return query select o.id,o.product_name,o.variant_label,o.buyer_contact,o.amount,o.state,o.created_at from public.ys_orders o order by o.created_at desc limit 100;
end; $$;
revoke all on function public.ys_admin_orders() from public;
grant execute on function public.ys_admin_orders() to authenticated;

create or replace function public.ys_approve_order(p_order_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare o public.ys_orders; stock_id uuid;
begin
 if not public.ys_is_admin() then raise exception 'Admin only'; end if;
 select * into o from public.ys_orders where id=p_order_id for update;
 if not found then raise exception 'Pesanan tidak ditemukan'; end if;
 if o.state <> 'pending' then raise exception 'Pesanan sudah diproses'; end if;
 if o.fulfillment_mode='stock' then
   select i.id into stock_id from public.ys_inventory i
   where i.product_id=o.product_id and i.variant_label=o.variant_label and i.state='available'
   order by i.created_at for update skip locked limit 1;
   if stock_id is null then
     update public.ys_orders set state='awaiting_stock',approved_at=now() where id=o.id;
     return 'awaiting_stock';
   end if;
   update public.ys_inventory set state='delivered',order_id=o.id where id=stock_id;
   update public.ys_orders set state='fulfilled',approved_at=now() where id=o.id;
   return 'fulfilled';
 end if;
 update public.ys_orders set state='approved',approved_at=now() where id=o.id;
 return 'approved';
end; $$;
revoke all on function public.ys_approve_order(uuid) from public;
grant execute on function public.ys_approve_order(uuid) to authenticated;

-- Delivery must be shown only to the buyer through authenticated ownership
-- or a separate short-lived, server-validated delivery token. Do NOT add an
-- anonymous RPC returning delivery_text based on order ID or lookup_token.
-- Do NOT store account passwords in products, HTML, or public Supabase tables.
