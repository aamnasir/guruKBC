-- ============================================================
-- Freemium: batas uji coba 7 hari ATAU 5 dokumen (mana lebih dulu)
-- ============================================================
-- PER AKUN GURU (bukan per sekolah) -- supaya kalau satu guru upgrade
-- ke paket berbayar, guru lain di sekolah yang sama TIDAK ikut premium.
--
-- Kalau Anda SUDAH PERNAH menjalankan versi sebelumnya (yang per
-- sekolah, tabel school_subscriptions), jalankan dulu baris di bawah
-- ini untuk membersihkannya sebelum lanjut:
--   drop function if exists public.increment_document_count(uuid);
--   drop table if exists public.school_subscriptions;
--
-- File tambahan, TIDAK menimpa supabase/schema.sql yang sudah ada.
-- Jalankan sekali di Supabase SQL Editor.
-- ============================================================

create table if not exists public.user_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro')),
  trial_started_at timestamptz not null default now(),
  documents_created integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_subscriptions_updated before update on public.user_subscriptions
  for each row execute function public.set_updated_at();

alter table public.user_subscriptions enable row level security;

-- Setiap guru HANYA boleh membaca status langganannya sendiri.
-- Sengaja TIDAK ada policy insert/update -- baris dibuat & counter-nya
-- bertambah hanya lewat fungsi di bawah, supaya guru tidak bisa ubah
-- plan/reset hitungan sendiri lewat DevTools/console.
create policy "users read own subscription" on public.user_subscriptions
  for select using (auth.uid() = user_id);

create or replace function public.increment_document_count()
returns public.user_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.user_subscriptions;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Anda belum masuk (belum login)';
  end if;

  insert into public.user_subscriptions (user_id)
  values (uid)
  on conflict (user_id) do nothing;

  update public.user_subscriptions
  set documents_created = documents_created + 1
  where user_id = uid
    and plan = 'free'
  returning * into result;

  if result is null then
    select * into result from public.user_subscriptions where user_id = uid;
  end if;

  return result;
end;
$$;

grant execute on function public.increment_document_count() to authenticated;

-- Menaikkan SATU guru ke paket berbayar setelah pembayaran dikonfirmasi
-- (tidak memengaruhi guru lain di sekolah yang sama):
--   update public.user_subscriptions set plan = 'pro' where user_id = '<id-user>';
