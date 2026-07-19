// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Jika environment variable tidak ada, kasih pesan error yang jelas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Next.js environment variables for Supabase. Pastikan .env.local ada dan server di-restart.');
}

// INI BAGIAN PENTING YANG HARUS ADA:
export const supabase = createClient(supabaseUrl, supabaseAnonKey);