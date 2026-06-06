// SavedAttractionRepository contract + Supabase implementation (SPEC §6.3,
// §9.5). Bookmarks and favorites are user-scoped rows in
// public.saved_attractions, protected by RLS (auth.uid() = user_id), so the
// repository never filters by user_id itself - the session and RLS do. This
// data only exists in Supabase, so there is no file implementation.
import { getSupabase } from '@/lib/supabase';
import type { SavedAttraction, SavedKind } from './types';

/** Raw public.saved_attractions row (snake_case, §6.3 columns). */
type SavedRow = {
  id: string;
  attraction_id: string;
  kind: SavedKind;
  created_at: string;
};

/** Map a database row to the domain SavedAttraction. */
function toSaved(row: SavedRow): SavedAttraction {
  return {
    id: row.id,
    attractionId: row.attraction_id,
    kind: row.kind,
    createdAt: row.created_at,
  };
}

/**
 * Persistence boundary for bookmarks and favorites. Implementations are
 * user-scoped via RLS; callers pass only the attraction and kind.
 */
export interface SavedAttractionRepository {
  /** All saved rows of a given kind for the signed-in user, newest first. */
  listByKind(kind: SavedKind): Promise<SavedAttraction[]>;
  /** Whether the user has saved this attraction under this kind. */
  isSaved(attractionId: string, kind: SavedKind): Promise<boolean>;
  /** Add a save; idempotent against the (user, attraction, kind) unique key. */
  add(attractionId: string, kind: SavedKind): Promise<void>;
  /** Remove a save; a no-op when it does not exist. */
  remove(attractionId: string, kind: SavedKind): Promise<void>;
}

export const supabaseSavedRepository: SavedAttractionRepository = {
  async listByKind(kind) {
    const { data, error } = await getSupabase()
      .from('saved_attractions')
      .select('id, attraction_id, kind, created_at')
      .eq('kind', kind)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as SavedRow[]).map(toSaved);
  },

  async isSaved(attractionId, kind) {
    const { data, error } = await getSupabase()
      .from('saved_attractions')
      .select('id')
      .eq('attraction_id', attractionId)
      .eq('kind', kind)
      .maybeSingle();
    if (error) throw error;
    return data !== null;
  },

  async add(attractionId, kind) {
    // user_id is set explicitly from the session so the insert satisfies the
    // RLS with-check (auth.uid() = user_id); there is no DB-side default.
    const {
      data: { user },
      error: userError,
    } = await getSupabase().auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Cannot save: no authenticated user.');

    const { error } = await getSupabase()
      .from('saved_attractions')
      .upsert(
        { user_id: user.id, attraction_id: attractionId, kind },
        { onConflict: 'user_id,attraction_id,kind', ignoreDuplicates: true },
      );
    if (error) throw error;
  },

  async remove(attractionId, kind) {
    // Defense in depth: scope the delete to the authenticated user explicitly
    // so a misconfigured RLS policy can never widen this into a cross-user
    // delete (the unique key is per user, but the filter must be too).
    const {
      data: { user },
      error: userError,
    } = await getSupabase().auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Cannot remove a save: no authenticated user.');

    const { error } = await getSupabase()
      .from('saved_attractions')
      .delete()
      .eq('user_id', user.id)
      .eq('attraction_id', attractionId)
      .eq('kind', kind);
    if (error) throw error;
  },
};
