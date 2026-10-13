-- Jalankan SETELAH semi-auto-order/schema.sql di Supabase SQL Editor.
-- QRIS manual: order dibuat pending, admin memverifikasi pembayaran secara manual.
-- Harga dari pelanggan bersifat estimasi, bukan bukti nominal pembayaran.
create or replace function public.yanstore_submit_manual_order(p_contact text,p_items jsonb,p_total bigint)
returns table(order_id uuid, code text)
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;v_code text;
begin
 if auth.uid() is null then raise exception 'Login anonim diperlukan'; end if;
 if length(trim(coalesce(p_contact,''))) not between 5 and 120 then raise exception 'Kontak tidak valid'; end if;
 if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 20 then raise exception 'Item tidak valid'; end if;
 if p_total is null or p_total < 0 or p_total > 100000000 then raise exception 'Total tidak valid'; end if;
 if exists(select 1 from public.yanstore_orders where customer_id=auth.uid() and created_at>now()-interval '1 minute') then raise exception 'Tunggu satu menit sebelum membuat pesanan lagi'; end if;
 insert into public.yanstore_orders(customer_id,customer_contact,items,total_amount,payment_provider,payment_status)
 values(auth.uid(),trim(p_contact),p_items,p_total,'manual_qris','pending') returning id,order_code into v_id,v_code;
 return query select v_id,v_code;
end $$;
revoke all on function public.yanstore_submit_manual_order(text,jsonb,bigint) from public,anon;
grant execute on function public.yanstore_submit_manual_order(text,jsonb,bigint) to authenticated;

create or replace function public.yanstore_admin_update_order(p_id uuid,p_payment text,p_fulfillment text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not coalesce(public.yanstore_is_chat_admin(),false) then raise exception 'Akses admin ditolak'; end if;
 if p_payment not in ('pending','paid','failed','expired') or p_fulfillment not in ('waiting','processing','completed') then raise exception 'Status tidak valid'; end if;
 if p_fulfillment <> 'waiting' and p_payment <> 'paid' then raise exception 'Pesanan belum lunas'; end if;
 update public.yanstore_orders set payment_status=p_payment,fulfillment_status=p_fulfillment,
 paid_at=case when p_payment='paid' then coalesce(paid_at,now()) else null end,
 completed_at=case when p_fulfillment='completed' then coalesce(completed_at,now()) else null end
 where id=p_id;
 if not found then raise exception 'Pesanan tidak ditemukan'; end if;
end $$;
revoke all on function public.yanstore_admin_update_order(uuid,text,text) from public,anon;
grant execute on function public.yanstore_admin_update_order(uuid,text,text) to authenticated;
