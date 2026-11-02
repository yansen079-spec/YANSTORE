-- YanStore: safely delete an unused invite/manual pool.
-- A pool with any allocation history is preserved to protect order records.
BEGIN;
CREATE OR REPLACE FUNCTION public.ys_admin_delete_invite_pool(p_pool_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.ys_stock_admin_check() THEN
    RAISE EXCEPTION 'Akses khusus admin';
  END IF;
  IF p_pool_id IS NULL THEN
    RAISE EXCEPTION 'ID stok tidak valid';
  END IF;
  PERFORM 1 FROM public.ys_account_pools WHERE id = p_pool_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entri stok tidak ditemukan';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.ys_account_allocations
    WHERE pool_id = p_pool_id
  ) THEN
    RAISE EXCEPTION 'Entri memiliki riwayat alokasi/pesanan dan tidak dapat dihapus';
  END IF;
  DELETE FROM public.ys_account_pools WHERE id = p_pool_id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.ys_admin_delete_invite_pool(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ys_admin_delete_invite_pool(uuid) TO authenticated;
COMMIT;
