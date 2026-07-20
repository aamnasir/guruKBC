import { createBrowserClient } from '@supabase/ssr';

export const createSupabaseClient = () => {
  return createBrowserClient (
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
};

export const supabase = typeof window !== 'undefined' ? createSupabaseClient() : (null as any);
