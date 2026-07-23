-- ============================================================
-- PERBAIKAN: menyesuaikan dengan struktur database yang SEBENARNYA
-- ============================================================
-- Database Anda memakai model "satu sekolah per guru"
-- (profiles.school_id, profiles.role) -- BUKAN model banyak-ke-banyak
-- (school_memberships) seperti asumsi file-file sebelumnya.
--
-- is_school_member() yang sudah ada di database Anda mengacu ke
-- tabel "school_members" yang tidak pernah ada -- selalu error kalau
-- dipanggil. Kita TIMPA isinya (bukan buat baru) supaya kebijakan RLS
-- yang sudah dibuat sebelumnya (school_assets, school_subscriptions,
-- storage bucket) otomatis mulai berfungsi tanpa perlu diubah lagi.
--
-- Jalankan sekali di Supabase SQL Editor.
-- ============================================================

create or replace function public.is_school_member(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and school_id = p_school_id
  );
$$;

create or replace function public.can_manage_school(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and school_id = p_school_id and role in ('admin','super_admin')
  );
$$;

-- Kode Sekolah, supaya guru bisa "bergabung" tanpa perlu diundang manual.
alter table public.schools add column if not exists join_code text;

update public.schools
set join_code = upper(substr(md5(random()::text || id::text), 1, 6))
where join_code is null;

alter table public.schools alter column join_code
  set default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'schools_join_code_unique') then
    alter table public.schools add constraint schools_join_code_unique unique (join_code);
  end if;
end $$;

-- Tabel "schools" hanya boleh di-INSERT oleh role admin/super_admin
-- (lihat policy "Admins can manage schools" yang sudah ada). Guru yang
-- baru daftar rolenya masih 'teacher' -- jadi butuh fungsi khusus
-- (security definer) untuk membuat sekolah baru DAN sekaligus
-- menaikkan role dirinya sendiri jadi 'admin', dengan aman:
-- fungsi ini TIDAK bisa dipakai mengubah sekolah/profil orang lain.
create or replace function public.create_school_and_become_admin(school_name text)
returns public.schools
language plpgsql
security definer
set search_path = public
as $$
declare
  new_school public.schools;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Anda belum masuk (belum login)';
  end if;

  insert into public.schools (name) values (school_name) returning * into new_school;

  update public.profiles set school_id = new_school.id, role = 'admin' where id = uid;

  if not found then
    insert into public.profiles (id, school_id, role, email)
    values (uid, new_school.id, 'admin', (select email from auth.users where id = uid));
  end if;

  return new_school;
end;
$$;

grant execute on function public.create_school_and_become_admin(text) to authenticated;

-- Fungsi lama dari file sebelumnya (schema_school_join.sql) mengacu ke
-- school_memberships yang tidak ada -- hapus supaya tidak membingungkan.
-- (Bergabung dengan kode sekarang dilakukan langsung dari aplikasi,
-- lihat perubahan queries.ts -- tidak perlu fungsi RPC terpisah karena
-- "schools" boleh dibaca semua orang login, dan "profiles" boleh
-- diubah oleh pemiliknya sendiri.)
drop function if exists public.join_school_by_code(text);
