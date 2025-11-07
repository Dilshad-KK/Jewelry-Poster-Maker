import { createClient } from '@supabase/supabase-js';

// Server-only admin client using Service Role key
// Do NOT expose SUPABASE_SERVICE_ROLE_KEY to the browser.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

export const supabaseAdmin = url && serviceRole
  ? createClient(url, serviceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : undefined;

