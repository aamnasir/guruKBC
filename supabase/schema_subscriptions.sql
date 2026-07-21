-- ============================================================
-- Freemium: batas uji coba 7 hari ATAU 5 dokumen (mana lebih dulu)
-- ============================================================
-- File tambahan, TIDAK menimpa supabase/schema.sql yang sudah ada.
-- Jalankan sekali di Supabase SQL Editor.
-- ============================================================

create table if not exists public.school_subscriptions (
  school_id uuid primary key references public.schools(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  trial_started_at timestamptz not null default now(),
  documents_created integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger school_subscriptions_updated before update on public.school_subscriptions
  for each row execute function public.set_updated_at();

alter table public.school_subscriptions enable row level security;

-- Anggota sekolah HANYA boleh membaca status langganan sekolahnya.
-- Sengaja TIDAK ada policy insert/update untuk pengguna biasa --
-- baris dibuat & counter-nya bertambah hanya lewat fungsi di bawah,
-- supaya pengguna tidak bisa mengubah plan/menonaktifkan hitungan
-- lewat DevTools/console.
create policy "members read own subscription" on public.school_subscriptions
  for select using (public.is_school_member(school_id));

-- Menaikkan status "pro" HANYA dilakukan manual oleh Anda lewat
-- SQL Editor / Table Editor setelah pembayaran dikonfirmasi, contoh:
--   update public.school_subscriptions set plan = 'pro' where school_id = '<id-sekolah>';

create or replace function public.increment_document_count(target_school_id uuid)
returns public.school_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.school_subscriptions;
begin
  if not public.is_school_member(target_school_id) then
    raise exception 'Bukan anggota sekolah ini';
  end if;

  insert into public.school_subscriptions (school_id)
  values (target_school_id)
  on conflict (school_id) do nothing;

  update public.school_subscriptions
  set documents_created = documents_created + 1
  where school_id = target_school_id
    and plan = 'free'
  returning * into result;

  if result is null then
    select * into result from public.school_subscriptions where school_id = target_school_id;
  end if;

  return result;
end;
$$;

grant execute on function public.increment_document_count(uuid) to authenticated;
