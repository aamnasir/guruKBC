# GuruKBC

SaaS administrasi guru untuk menyusun perangkat pembelajaran Deep Learning Kurikulum Berbasis Cinta (KBC).

## Struktur

- `web/` — aplikasi Next.js (App Router).
- `supabase/` — konfigurasi lokal dan skema PostgreSQL Supabase.
- `PRD_GuruKBC_v1.md` — kebutuhan produk dan urutan roadmap.

## Menjalankan aplikasi

1. Salin `web/.env.example` menjadi `web/.env.local`, lalu isi kredensial Supabase bila tersedia.
2. Jalankan `npm run dev` dari root proyek.
3. Buka `http://localhost:3000`.

Untuk database lokal, pasang Supabase CLI lalu jalankan `supabase start` dari folder root dan terapkan `supabase/schema.sql` melalui migration atau SQL Editor. Jangan gunakan kredensial database contoh di skrip.
