-- YanStore customer-safe order status RPC
-- Buyer must know both checkout code and the same contact used at checkout.
-- Returns status only; does not expose inventory or credentials.

create or replace function public.yanstore_customer_order_status(
  p_checkout_code text,
  p_contact text
)
returns table (
  checkout_code text,
  state text,
  item_count bigint
)
language sql
stable
security definer
set search_path=public
as $$
  with matched as (
    select o.state
    from public.ys_orders o
    where o.checkout_code = trim(coalesce(p_checkout_code,''))
      and trim(o.buyer_contact) = trim(coalesce(p_contact,''))
  )
  select
    trim(coalesce(p_checkout_code,'')) as checkout_code,
    case
      when count(*) = 0 then 'not_found'
      when bool_and(state='canceled') then 'canceled'
      when bool_and(state='fulfilled') then 'fulfilled'
      when bool_and(state in ('approved','fulfilled')) then 'approved'
      else 'pending'
    end as state,
    count(*)::bigint as item_count
  from matched;
$$;

revoke all on function public.yanstore_customer_order_status(text,text) from public;
grant execute on function public.yanstore_customer_order_status(text,text) to authenticated;
