-- YanStore Phase 3: account groups for PRIVATE and SHARING.
-- NO passwords, account emails, or delivery secrets in this migration.
-- Requires Phase 1 + Phase 2.
BEGIN;
CREATE TABLE IF NOT EXISTS public.ys_account_groups (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 product_id bigint NOT NULL REFERENCES public.products(id),
 variant_label text NOT NULL,
 label text NOT NULL,
 mode text NOT NULL CHECK(mode IN ('private','sharing')),
 capacity integer NOT NULL CHECK(capacity BETWEEN 1 AND 20),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT ys_account_mode_capacity CHECK(mode <> 'private' OR capacity=1)
);
CREATE TABLE IF NOT EXISTS public.ys_account_allocations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id uuid NOT NULL REFERENCES public.ys_account_groups(id),
 order_id uuid NOT NULL UNIQUE REFERENCES public.ys_orders(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz
);
CREATE INDEX IF NOT EXISTS ys_account_allocations_account_idx ON public.ys_account_allocations(account_id);
ALTER TABLE public.ys_account_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ys_account_allocations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ys_account_groups FROM PUBLIC,anon,authenticated;
REVOKE ALL ON public.ys_account_allocations FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.ys_account_create(
 p_product_id bigint,p_variant text,p_label text,p_mode text,p_capacity integer
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE new_id uuid;
BEGIN
 IF NOT public.ys_stock_admin_check() THEN RAISE EXCEPTION 'Akses khusus admin'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.products WHERE id=p_product_id) THEN RAISE EXCEPTION 'Produk tidak ditemukan'; END IF;
 IF p_variant IS NULL OR length(trim(p_variant)) NOT BETWEEN 1 AND 160 THEN RAISE EXCEPTION 'Varian tidak valid'; END IF;
 IF p_label IS NULL OR length(trim(p_label)) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Label tidak valid'; END IF;
 IF p_mode NOT IN ('private','sharing') OR p_mode IS NULL THEN RAISE EXCEPTION 'Jenis akun tidak valid'; END IF;
 IF p_capacity IS NULL OR p_capacity NOT BETWEEN 1 AND 20 OR (p_mode='private' AND p_capacity<>1) THEN RAISE EXCEPTION 'Kapasitas tidak valid'; END IF;
 INSERT INTO public.ys_account_groups(product_id,variant_label,label,mode,capacity)
 VALUES(p_product_id,trim(p_variant),trim(p_label),p_mode,p_capacity)
 RETURNING id INTO new_id;
 RETURN new_id;
END; $$;
REVOKE ALL ON FUNCTION public.ys_account_create(bigint,text,text,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ys_account_create(bigint,text,text,text,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.ys_account_summary()
RETURNS TABLE(id uuid,product_name text,variant_label text,label text,mode text,capacity integer,used bigint,remaining bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
BEGIN
 IF NOT public.ys_stock_admin_check() THEN RAISE EXCEPTION 'Akses khusus admin'; END IF;
 RETURN QUERY
 SELECT a.id,p.name,a.variant_label,a.label,a.mode,a.capacity,
 count(x.id)::bigint,(a.capacity-count(x.id))::bigint
 FROM public.ys_account_groups a
 JOIN public.products p ON p.id=a.product_id
 LEFT JOIN public.ys_account_allocations x ON x.account_id=a.id
 GROUP BY a.id,p.name
 ORDER BY p.name,a.created_at;
END; $$;
REVOKE ALL ON FUNCTION public.ys_account_summary() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ys_account_summary() TO authenticated;
COMMIT;
-- Capacity tracking only. No checkout/fulfillment/credential storage enabled.
