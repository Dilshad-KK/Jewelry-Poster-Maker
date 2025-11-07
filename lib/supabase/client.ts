import { createClient } from '@supabase/supabase-js';

// Support both the correct var name and the user-provided typo
const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABSE_ANON_KEY) as string;

if (!url || !anon) {
  // Intentionally avoid throwing at import time to not break builds
  // Consumers should handle missing client via runtime checks/logs
  // eslint-disable-next-line no-console
  console.warn('Supabase client missing env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabaseBrowser = url && anon ? createClient(url, anon) : undefined;

