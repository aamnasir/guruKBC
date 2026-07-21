-- ============================================================
-- Pengaturan Aset (Logo & Tanda Tangan)
-- ============================================================
-- File tambahan, TIDAK menimpa supabase/schema.sql yang sudah ada.
-- Jalankan sekali di Supabase SQL Editor. Tabel school_assets ini
-- sebenarnya sudah didefinisikan tipenya di lib/supabase/types.ts,
-- tapi tabelnya belum pernah dibuat -- ini melengkapinya, plus
-- storage bucket untuk menyimpan file logo/tanda tangan.
-- ============================================================

create table if not exists public.school_assets (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  asset_type text not null check (asset_type in ('logo','signature','template','export')),
  file_name text not null,
  file_path text not null,          -- path di storage bucket "school-assets"
  file_size bigint,
  mime_type text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, asset_type)    -- satu logo & satu tanda tangan aktif per sekolah
);

create trigger school_assets_updated before update on public.school_assets
  for each row execute function public.set_updated_at();

alter table public.school_assets enable row level security;

create policy "members access school assets" on public.school_assets
  for all using (public.is_school_member(school_id)) with check (public.is_school_member(school_id));

-- ============================================================
-- Storage bucket untuk file logo & tanda tangan
-- ============================================================
insert into storage.buckets (id, name, public)
values ('school-assets', 'school-assets', true)
on conflict (id) do nothing;

-- Path file HARUS diawali "<school_id>/..." supaya kebijakan di
-- bawah bisa memverifikasi keanggotaan sekolah pengunggah.
create policy "public read school assets files" on storage.objects
  for select using (bucket_id = 'school-assets');

create policy "members upload school assets files" on storage.objects
  for insert with check (
    bucket_id = 'school-assets'
    and public.is_school_member(((storage.foldername(name))[1])::uuid)
  );

create policy "members update school assets files" on storage.objects
  for update using (
    bucket_id = 'school-assets'
    and public.is_school_member(((storage.foldername(name))[1])::uuid)
  );

create policy "members delete school assets files" on storage.objects
  for delete using (
    bucket_id = 'school-assets'
    and public.is_school_member(((storage.foldername(name))[1])::uuid)
  );
