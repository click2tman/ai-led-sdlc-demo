/// <reference types="vite/client" />

// Typed environment variables (SPEC §16). Augments Vite's ImportMetaEnv so
// VITE_ vars resolve to string rather than any.
interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  readonly VITE_ATTRACTIONS_SOURCE?: 'file' | 'supabase';
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
