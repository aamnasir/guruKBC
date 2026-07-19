import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Deklarasikan variabel di top-level menggunakan let atau const
let supabaseClientInstance: SupabaseClient | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Supabase client is disabled.');
} else {
  supabaseClientInstance = createClient(supabaseUrl, supabaseAnonKey);
}

// Lakukan export variabel di tingkat paling luar file
export const supabase = supabaseClientInstance;
