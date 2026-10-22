-- YanStore Phase 3C: admin-only pool pause and retirement. No credentials.
BEGIN;
CREATE OR REPLACE FUNCTION public.ys_pool_set_state(p_pool_id uuid,p_state text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_old text;
BEGIN
 IF NOT public.ys_stock_admin_check() THEN RAISE EXCEPTION 'Akses khusus admin'; END IF;
 IF p_pool_id IS NULL OR p_state IS NULL OR p_state NOT IN ('paused','retired') THEN RAISE EXCEPTION 'Status tidak diizinkan'; END IF;
 SELECT state INTO v_old FROM public.ys_account_pools WHERE id=p_pool_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Kelompok akun tidak ditemukan'; END IF;
 IF v_old='retired' THEN RAISE EXCEPTION 'Kelompok pensiun tidak bisa diubah'; END IF;
 IF p_state='retired' AND EXISTS (SELECT 1 FROM public.ys_account_allocations WHERE pool_id=p_pool_id AND state IN ('reserved','active'))
 THEN RAISE EXCEPTION 'Masih ada pembeli aktif atau reservasi'; END IF;
 UPDATE public.ys_account_pools SET state=p_state WHERE id=p_pool_id;
 RETURN p_state;
END; $$;
REVOKE ALL ON FUNCTION public.ys_pool_set_state(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ys_pool_set_state(uuid,text) TO authenticated;
COMMIT;
