-- YANSTORE AUTO STOCK - PHASE 1 (SAFE DATABASE FOUNDATION)
-- This phase creates private metadata tables only.
-- It does NOT accept payments, store account passwords, or send accounts.
-- Run in the YanStore Supabase SQL Editor after reviewing the statements.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.ys_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 product_id bigint NOT NULL REFERENCES public.products(id),
 product_name text NOT NULL,
 variant_label text NOT NULL DEFAULT '',
 amount integer NOT NULL CHECK (amount > 0),
 buyer_contact text NOT NULL,
 fulfillment_mode text NOT NULL DEFAULT 'stock' CHECK (fulfillment_mode IN ('stock','manual','invite')),
 state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','approved','fulfilled','awaiting_stock','rejected')),
 created_at timestamptz NOT NULL DEFAULT now(),
 approved_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.ys_inventory (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 product_id bigint NOT NULL REFERENCES public.products(id),
 variant_label text NOT NULL DEFAULT '',
 state text NOT NULL DEFAULT 'available' CHECK (state IN ('available','reserved','delivered','disabled')),
 order_id uuid UNIQUE REFERENCES public.ys_orders(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ys_inventory_lookup ON public.ys_inventory(product_id,variant_label,state);

-- Keep these tables inaccessible to browser API users for now.
ALTER TABLE public.ys_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ys_inventory ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ys_orders FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.ys_inventory FROM PUBLIC, anon, authenticated;

-- Also revoke default public schema access to these tables via views/functions:
-- No public RPCs, policies, or views are created in this phase.
COMMIT;

-- Verification (read-only): expect two rows, ys_inventory and ys_orders.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ys_inventory','ys_orders')
ORDER BY table_name;
