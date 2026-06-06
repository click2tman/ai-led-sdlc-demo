// Content barrel (SPEC §5.2.3). The single import surface for the UI:
// `import { attractions, t } from '@/lib/content'`. Selects the active
// AttractionRepository from VITE_ATTRACTIONS_SOURCE so the backend swaps
// (file -> supabase -> payload) without touching a single component.
import { fileAttractionRepository } from './attractions.file';
import { supabaseAttractionRepository } from './attractions.supabase';
import type { AttractionRepository } from './attractions';

const source = import.meta.env.VITE_ATTRACTIONS_SOURCE ?? 'file';

/**
 * Resolve the active attractions repository from VITE_ATTRACTIONS_SOURCE.
 * Unknown values fail fast rather than silently falling back to file, which
 * would mask a misconfigured deploy. The supabase repository is import-safe in
 * file mode: it touches the Supabase client only when a method is called.
 */
function selectRepository(): AttractionRepository {
  switch (source) {
    case 'file':
      return fileAttractionRepository;
    case 'supabase':
      return supabaseAttractionRepository;
    default:
      throw new Error(
        `Unknown VITE_ATTRACTIONS_SOURCE "${source}". Expected "file" or "supabase".`,
      );
  }
}

export const attractions: AttractionRepository = selectRepository();

export { t } from './strings';
export type { StringKey } from './strings';
export type { AttractionRepository } from './attractions';
