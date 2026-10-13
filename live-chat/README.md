# YanStore Live Chat + WhatsApp

Status: **persiapan, belum aktif di website**.

## Rancangan

- Tombol WhatsApp lama tetap dipertahankan.
- Live chat pelanggan menggunakan Supabase Auth (anonymous sign-in harus diaktifkan di Supabase) agar setiap pelanggan memiliki identitas terpisah.
- Pesan dan percakapan disimpan di Supabase dengan Row Level Security (RLS).
- Admin login melalui Supabase Auth dan diberi role admin melalui tabel otorisasi server-side, **bukan password hardcoded dalam HTML**.
- Pengunjung hanya bisa membaca dan menulis percakapannya sendiri; admin yang berwenang dapat menangani percakapan.
- Refresh pesan berkala sebagai fallback realtime.

## Sebelum aktif

1. Audit struktur HTML production dan autentikasi admin lama.
2. Buat migrasi SQL untuk tabel, kebijakan RLS, dan indeks.
3. Implementasikan UI widget pelanggan dan inbox admin.
4. Uji login, isolasi percakapan antar pelanggan, dan akses admin.
5. Integrasikan widget ke halaman production dan uji deployment preview.

**Jangan deploy chat tanpa kebijakan RLS yang sudah diuji.**
