-- YanStore: optional manual stock count per product variant.
-- NULL means the quantity has not been configured yet; existing READY/RESTOCK/HABIS
-- behavior remains unchanged until an admin enters a numeric quantity.
alter table public.product_variants
  add column if not exists stock_quantity integer;

alter table public.product_variants
  drop constraint if exists product_variants_stock_quantity_nonnegative;

alter table public.product_variants
  add constraint product_variants_stock_quantity_nonnegative
  check (stock_quantity is null or stock_quantity >= 0);
