-- ============================================================
-- Monetisasi per-sekolah + pesanan pembayaran Midtrans
-- ============================================================
-- File tambahan, TIDAK menimpa file skema lain yang sudah ada.
-- Jalankan sekali di Supabase SQL Editor, SETELAH schema_subscriptions.sql
-- (yang berisi user_subscriptions per-guru) sudah dijalankan.
--
-- Model akhir: seorang guru dianggap "pro" kalau SALAH SATU benar:
--   - user_subscriptions miliknya sendiri plan = 'pro', ATAU
--   - school_subscriptions milik sekolahnya plan = 'pro' (langganan
--     sekolah/madrasah, berlaku untuk SEMUA anggota sekolah itu)
-- ============================================================

create table if not exists public.school_subscriptions (
  school_id uuid primary key references public.schools(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  updated_at timestamptz not null default now()
);

create trigger school_subscriptions_updated before update on public.school_subscriptions
  for each row execute function public.set_updated_at();

alter table public.school_subscriptions enable row level security;

-- Anggota sekolah hanya boleh MEMBACA status langganan sekolahnya.
-- Sengaja TIDAK ADA policy insert/update untuk klien -- baris ini
-- hanya diubah oleh webhook Midtrans (pakai service role key,
-- melewati RLS) atau manual oleh Anda di SQL Editor.
create policy "members read school subscription" on public.school_subscriptions
  for select using (public.is_school_member(school_id));

-- ============================================================
-- Pesanan pembayaran (dibuat server, diverifikasi lewat webhook)
-- ============================================================
create table if not exists public.payment_orders (
  order_id text primary key,
  target_type text not null check (target_type in ('user','school')),
  target_id uuid not null,
  amount integer not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','expired')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger payment_orders_updated before update on public.payment_orders
  for each row execute function public.set_updated_at();

alter table public.payment_orders enable row level security;

-- Guru hanya bisa melihat pesanannya sendiri. Insert/update HANYA
-- lewat server (service role key) -- lihat app/api/midtrans/*.
create policy "users read own orders" on public.payment_orders
  for select using (created_by = auth.uid());
