// Content barrel (SPEC §5.2.3). The single import surface for the UI:
// `import { attractions, t } from '@/lib/content'`. Selects the active
// AttractionRepository from VITE_ATTRACTIONS_SOURCE so the backend swaps
// (file -> supabase -> payload) without touching a single component.
import { fileAttractionRepository } from './attractions.file';
import type { AttractionRepository } from './attractions';

const source = import.meta.env.VITE_ATTRACTIONS_SOURCE ?? 'file';

/**
 * Resolve the active attractions repository. Phase 2.5 adds the supabase
 * branch; until then, requesting it fails fast (no silent fallback to file,
 * which would mask a misconfigured deploy).
 */
function selectRepository(): AttractionRepository {
  switch (source) {
    case 'file':
      return fileAttractionRepository;
    case 'supabase':
      throw new Error(
        'VITE_ATTRACTIONS_SOURCE=supabase is not wired until Phase 2.5. ' +
          'Set VITE_ATTRACTIONS_SOURCE=file or complete the Phase 2.5 migration.',
      );
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
