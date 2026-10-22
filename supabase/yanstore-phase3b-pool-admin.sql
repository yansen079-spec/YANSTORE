-- YanStore Phase 3B: admin-only account pool metadata. No credentials or deliveries.
BEGIN;
CREATE OR REPLACE FUNCTION public.ys_pool_create(p_product_id bigint,p_variant_label text,p_access_mode text,p_capacity integer)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid;
BEGIN
 IF NOT public.ys_stock_admin_check() THEN RAISE EXCEPTION 'Akses khusus admin'; END IF;
 IF p_product_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.products WHERE id=p_product_id) THEN RAISE EXCEPTION 'Produk tidak ditemukan'; END IF;
 IF p_variant_label IS NULL OR length(trim(p_variant_label)) NOT BETWEEN 1 AND 160 THEN RAISE EXCEPTION 'Varian tidak valid'; END IF;
 IF p_access_mode NOT IN ('private','sharing') OR p_capacity IS NULL OR p_capacity NOT BETWEEN 1 AND 20 OR (p_access_mode='private' AND p_capacity<>1) OR (p_access_mode='sharing' AND p_capacity<2) THEN RAISE EXCEPTION 'Jenis akun atau kapasitas tidak valid'; END IF;
 INSERT INTO public.ys_account_pools(product_id,variant_label,access_mode,capacity,state)
 VALUES(p_product_id,trim(p_variant_label),p_access_mode,p_capacity,'draft') RETURNING id INTO v_id;
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.ys_pool_create(bigint,text,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ys_pool_create(bigint,text,text,integer) TO authenticated;
CREATE OR REPLACE FUNCTION public.ys_pool_summary()
RETURNS TABLE(pool_id uuid,product_name text,variant_label text,access_mode text,capacity integer,state text,allocated bigint,remaining bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT public.ys_stock_admin_check() THEN RAISE EXCEPTION 'Akses khusus admin'; END IF;
 RETURN QUERY SELECT p.id, pr.name, p.variant_label,p.access_mode,p.capacity,p.state,
 count(a.id) FILTER (WHERE a.state IN ('reserved','active'))::bigint,
 greatest(0,p.capacity-count(a.id) FILTER (WHERE a.state IN ('reserved','active')))::bigint
 FROM public.ys_account_pools p JOIN public.products pr ON pr.id=p.product_id
 LEFT JOIN public.ys_account_allocations a ON a.pool_id=p.id
 GROUP BY p.id,pr.name,p.variant_label,p.access_mode,p.capacity,p.state,p.created_at
 ORDER BY p.created_at DESC;
END; $$;
REVOKE ALL ON FUNCTION public.ys_pool_summary() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ys_pool_summary() TO authenticated;
COMMIT;
-- All pools remain draft. Remaining capacity is informational, NOT sellable stock.
