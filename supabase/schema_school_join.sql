-- ============================================================
-- Kode Sekolah -- pembeda role saat mendaftar
-- ============================================================
-- File tambahan, TIDAK menimpa supabase/schema.sql yang sudah ada.
-- Jalankan sekali di Supabase SQL Editor.
--
-- Sebelum ini, TIDAK ADA cara bagi guru untuk bergabung ke sekolah:
-- school_memberships hanya terisi otomatis untuk orang yang membuat
-- baris "schools" (jadi 'owner'), dan RLS-nya mengharuskan sudah jadi
-- anggota untuk bisa menambah anggota lain -- jalan buntu untuk
-- pendaftaran mandiri. File ini menambahkan "kode sekolah" supaya:
--   - Kepala Madrasah/Admin: daftar -> buat sekolah baru -> dapat kode
--   - Guru: daftar -> masukkan kode dari Kepala Madrasah -> otomatis
--     jadi anggota dengan role 'teacher'
-- ============================================================

alter table public.schools add column if not exists join_code text;

update public.schools
set join_code = upper(substr(md5(random()::text || id::text), 1, 6))
where join_code is null;

alter table public.schools alter column join_code
  set default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'schools_join_code_unique'
  ) then
    alter table public.schools add constraint schools_join_code_unique unique (join_code);
  end if;
end $$;

-- Guru memasukkan kode ini untuk bergabung. Fungsi ini security definer
-- supaya bisa mencari sekolah berdasar kode (guru belum jadi anggota,
-- jadi belum boleh SELECT langsung dari tabel schools) dan menambahkan
-- DIRINYA SENDIRI saja sebagai 'teacher' -- tidak bisa memilih role lain
-- atau menambahkan orang lain.
create or replace function public.join_school_by_code(code text)
returns public.school_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  target_school_id uuid;
  result public.school_memberships;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Anda belum masuk (belum login)';
  end if;

  select id into target_school_id from public.schools where join_code = upper(trim(code));
  if target_school_id is null then
    raise exception 'Kode sekolah tidak ditemukan';
  end if;

  insert into public.school_memberships (school_id, user_id, role)
  values (target_school_id, uid, 'teacher')
  on conflict (school_id, user_id) do nothing;

  select * into result from public.school_memberships where school_id = target_school_id and user_id = uid;
  return result;
end;
$$;

grant execute on function public.join_school_by_code(text) to authenticated;
