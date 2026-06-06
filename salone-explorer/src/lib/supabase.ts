// Supabase browser client (SPEC §5.3, §19 P5). Reads the public anon
// configuration from VITE_-prefixed env vars; the service-role key never
// reaches the client. Configuration is validated at module load so a
// misconfigured deploy fails fast and loudly rather than silently degrading.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Supabase is not configured: set VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_ANON_KEY (see .env.example). The anon key is safe to ' +
      'expose; never expose the service-role key.',
  );
}

export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
