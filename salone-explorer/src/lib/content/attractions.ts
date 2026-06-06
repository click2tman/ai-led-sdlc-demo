// AttractionRepository contract (SPEC §5.2.3). Every backend - file
// (Phase 1), supabase (Phase 2.5), payload (Phase 8) - implements this
// interface so UI code never depends on the data source. Changing this
// interface is a public-contract change; stop and ask per CLAUDE.md.
import type { Attraction } from '@/data/types';

export interface AttractionRepository {
  /** All attractions, ordered for display. */
  getAll(): Promise<Attraction[]>;
  /** A single attraction by its slug id, or null when absent. */
  getById(id: string): Promise<Attraction | null>;
}
