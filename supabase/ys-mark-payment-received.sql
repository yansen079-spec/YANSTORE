-- YanStore: mark payment received without allocating YanStore legacy stock.
-- Admin-only. Fulfillment will be handled separately from HomeOffice stock.

create or replace function public.ys_mark_payment_received(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.ys_is_admin() then
    raise exception 'Admin only';
  end if;

  update public.ys_orders
  set state='approved',
      approved_at=coalesce(approved_at,now())
  where id=p_order_id
    and state='pending';

  if not found then
    if exists(select 1 from public.ys_orders where id=p_order_id and state='approved') then
      return true;
    end if;
    raise exception 'Pesanan tidak ditemukan atau status bukan pending';
  end if;

  return true;
end;
$$;

revoke all on function public.ys_mark_payment_received(uuid) from public;
grant execute on function public.ys_mark_payment_received(uuid) to authenticated;
