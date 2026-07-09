import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not set');
}

/**
 * Browser/anon client — safe to use in client components.
 * Respects Row Level Security.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-only admin client using the service-role key.
 * NEVER import this into a client component — it bypasses Row Level Security.
 *
 * Falls back to the anon key if the service-role key is missing so the module
 * can still load, but privileged queries will fail until the key is set.
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
