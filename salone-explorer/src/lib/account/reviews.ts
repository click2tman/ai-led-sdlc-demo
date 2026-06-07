// ReviewRepository contract + Supabase implementation (SPEC §6.6, §9.3,
// ADR 0004 D4). User-authored, Supabase-only data; same pattern as
// saved/bookings. RLS (published-read + own-manage) is the primary guard;
// writes also set/filter user_id from the session as defense in depth.
// subscribe() wraps a Realtime channel for the live ReviewList and no-ops
// when Supabase is unconfigured so it never throws during SSG.
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { NewReview, Review, ReviewStatus } from './types';

/** Raw public.reviews row (snake_case, §6.6 columns + updated_at). */
type ReviewRow = {
  id: string;
  user_id: string;
  attraction_id: string;
  rating: number;
  body: string;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
};

const COLUMNS = 'id, user_id, attraction_id, rating, body, status, created_at, updated_at';

/** Map a database row to the domain Review. */
function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    attractionId: row.attraction_id,
    userId: row.user_id,
    rating: row.rating,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Patch shape for editing one's own review (rating and/or body). */
export type ReviewPatch = { rating?: number; body?: string };

/**
 * Persistence boundary for reviews. Reads are RLS-scoped (published, or the
 * caller's own); writes are author-only. subscribe() is client-only.
 */
export interface ReviewRepository {
  /** Published reviews for an attraction, newest first. */
  listPublished(attractionId: string): Promise<Review[]>;
  /** The caller's own review for an attraction (any status), or null. */
  getOwn(attractionId: string): Promise<Review | null>;
  /** Create the caller's review; throws on the one-per-attraction conflict. */
  create(input: NewReview): Promise<Review>;
  /** Edit the caller's own review. */
  updateOwn(id: string, patch: ReviewPatch): Promise<Review>;
  /** Delete the caller's own review. */
  deleteOwn(id: string): Promise<void>;
  /**
   * Subscribe to published-review changes for an attraction via Realtime.
   * Calls onChange on any insert/update/delete; returns a teardown. No-ops
   * (returns a noop teardown) when Supabase is unconfigured.
   */
  subscribe(attractionId: string, onChange: () => void): () => void;
}

/** Read the authenticated user id, failing fast when signed out. */
async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await getSupabase().auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Cannot manage a review: no authenticated user.');
  return user.id;
}

export const supabaseReviewRepository: ReviewRepository = {
  async listPublished(attractionId) {
    const { data, error } = await getSupabase()
      .from('reviews')
      .select(COLUMNS)
      .eq('attraction_id', attractionId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as ReviewRow[]).map(toReview);
  },

  async getOwn(attractionId) {
    const userId = await requireUserId();
    const { data, error } = await getSupabase()
      .from('reviews')
      .select(COLUMNS)
      .eq('attraction_id', attractionId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data ? toReview(data as ReviewRow) : null;
  },

  async create(input) {
    const userId = await requireUserId();
    const { data, error } = await getSupabase()
      .from('reviews')
      .insert({
        user_id: userId,
        attraction_id: input.attractionId,
        rating: input.rating,
        body: input.body,
      })
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return toReview(data as ReviewRow);
  },

  async updateOwn(id, patch) {
    const userId = await requireUserId();
    const { data, error } = await getSupabase()
      .from('reviews')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return toReview(data as ReviewRow);
  },

  async deleteOwn(id) {
    const userId = await requireUserId();
    const { error } = await getSupabase()
      .from('reviews')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  subscribe(attractionId, onChange) {
    if (!isSupabaseConfigured()) return () => {};
    const supabase = getSupabase();
    const channel = supabase
      .channel(`reviews:${attractionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `attraction_id=eq.${attractionId}`,
        },
        () => onChange(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  },
};
