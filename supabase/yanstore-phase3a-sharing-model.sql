-- YanStore Phase 3A: account capacity metadata only. NO CREDENTIALS.
-- Requires ys_orders and products from earlier phases.
BEGIN;
CREATE TABLE IF NOT EXISTS public.ys_account_pools (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 product_id bigint NOT NULL REFERENCES public.products(id),
 variant_label text NOT NULL CHECK (length(trim(variant_label)) BETWEEN 1 AND 160),
 access_mode text NOT NULL CHECK (access_mode IN ('private','sharing')),
 capacity integer NOT NULL CHECK (capacity BETWEEN 1 AND 20),
 state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','ready','paused','retired')),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT ys_private_capacity CHECK (access_mode <> 'private' OR capacity = 1),
 CONSTRAINT ys_sharing_capacity CHECK (access_mode <> 'sharing' OR capacity >= 2)
);
CREATE TABLE IF NOT EXISTS public.ys_account_allocations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 pool_id uuid NOT NULL REFERENCES public.ys_account_pools(id),
 order_id uuid NOT NULL UNIQUE REFERENCES public.ys_orders(id),
 state text NOT NULL DEFAULT 'reserved' CHECK (state IN ('reserved','active','ended','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz
);
CREATE INDEX IF NOT EXISTS ys_allocations_pool_state ON public.ys_account_allocations(pool_id,state);
ALTER TABLE public.ys_account_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ys_account_allocations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ys_account_pools FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.ys_account_allocations FROM PUBLIC, anon, authenticated;
COMMIT;
SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('ys_account_pools','ys_account_allocations') ORDER BY table_name;
