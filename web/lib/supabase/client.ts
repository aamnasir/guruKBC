import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createSupabaseClient = () => {
  // Jangan crash kalau env var belum terbaca (mis. saat build/deploy Vercel
  // belum sinkron). Kembalikan null agar UI bisa menampilkan pesan yang jelas,
  // bukan membuat seluruh halaman gagal hydrate.
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Supabase belum terkonfigurasi: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY kosong.'
    );
    return null as any;
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Gagal membuat Supabase client:', err);
    return null as any;
  }
};

export const supabase = typeof window !== 'undefined' ? createSupabaseClient() : (null as any);
