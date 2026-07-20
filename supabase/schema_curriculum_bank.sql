-- ============================================================
-- Bank Tema / Topik / Tujuan Pembelajaran (TP) - Kurikulum Berbasis Cinta
-- ============================================================
-- File tambahan, TIDAK menimpa supabase/schema.sql yang sudah ada.
-- Jalankan sekali di Supabase SQL Editor.
--
-- Ini murni struktur tabel (skema). Isinya (nama tema, topik, dan
-- rumusan TP) sengaja dikosongkan -- diisi sendiri oleh madrasah
-- sesuai dokumen resmi KBC, supaya kontennya akurat.
--
-- Struktur: 1 Mata Pelajaran -> banyak Tema -> banyak Topik -> banyak TP
-- Data ini GLOBAL (dipakai bersama semua sekolah pengguna GuruKBC),
-- makanya tidak ada school_id -- persis pola "document_templates"
-- yang sudah ada di schema.sql (school_id null = konten bersama).
-- ============================================================

create table if not exists public.curriculum_themes (
  id uuid primary key default gen_random_uuid(),
  subject_name text not null,              -- harus sama persis dengan nama di katalog Mata Pelajaran
  phase text not null check (phase in ('A','B','C')),  -- A = kelas 1-2, B = kelas 3-4, C = kelas 5-6
  name text not null,                      -- nama tema
  sequence smallint not null default 1,    -- urutan tampil
  created_at timestamptz not null default now()
);

create table if not exists public.curriculum_topics (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid not null references public.curriculum_themes(id) on delete cascade,
  name text not null,                      -- nama topik / sub-tema
  sequence smallint not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.curriculum_objectives (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.curriculum_topics(id) on delete cascade,
  code text,                               -- kode TP, contoh: "TP 1.1" (boleh kosong)
  description text not null,               -- rumusan tujuan pembelajaran
  sequence smallint not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_curriculum_themes_subject_phase on public.curriculum_themes (subject_name, phase);
create index if not exists idx_curriculum_topics_theme on public.curriculum_topics (theme_id);
create index if not exists idx_curriculum_objectives_topic on public.curriculum_objectives (topic_id);

alter table public.curriculum_themes enable row level security;
alter table public.curriculum_topics enable row level security;
alter table public.curriculum_objectives enable row level security;

-- Semua guru yang login boleh MEMBACA (untuk dropdown pilihan).
-- Tidak ada policy insert/update/delete -> hanya bisa diisi lewat
-- SQL Editor Supabase (service role), sesuai yang Anda mau.
create policy "authenticated read curriculum themes" on public.curriculum_themes for select using (auth.role() = 'authenticated');
create policy "authenticated read curriculum topics" on public.curriculum_topics for select using (auth.role() = 'authenticated');
create policy "authenticated read curriculum objectives" on public.curriculum_objectives for select using (auth.role() = 'authenticated');

-- ============================================================
-- CONTOH cara mengisi (GANTI teks di bawah dengan konten resmi KBC Anda).
-- Jalankan berurutan: tema dulu, lalu topik pakai id tema, lalu TP pakai id topik.
-- ============================================================
-- insert into public.curriculum_themes (subject_name, phase, name, sequence)
-- values ('Bahasa Indonesia', 'A', 'CONTOH: Nama tema dari dokumen KBC', 1)
-- returning id;
--
-- -- salin id yang dikembalikan di atas, pakai di sini:
-- insert into public.curriculum_topics (theme_id, name, sequence)
-- values ('<id-tema-dari-atas>', 'CONTOH: Nama topik', 1)
-- returning id;
--
-- insert into public.curriculum_objectives (topic_id, code, description, sequence)
-- values ('<id-topik-dari-atas>', 'TP 1.1', 'CONTOH: rumusan tujuan pembelajaran sesuai dokumen KBC', 1);
