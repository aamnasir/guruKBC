import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Returns null in local UI mode when Supabase has not yet been configured. */
export const supabase = url && key ? createClient(url, key) : null;
