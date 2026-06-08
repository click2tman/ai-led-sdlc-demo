// FlagRepository + moderation contract + Supabase implementation (issue #50,
// ADR 0009). Flagging is user-scoped (RLS auth.uid()=user_id, one flag per user
// per review, own-row read so counts never leak). Moderation actions update
// reviews.status under the moderator RLS policy + the content-guard trigger, so
// a moderator can change only status, never body/rating. Counts reach
// moderators through the gated list_moderation_queue RPC, never the raw table.
// Supabase-only (user data); RLS is the primary guard, writes also filter
// user_id as defense in depth (mirrors reviews.ts/bookings.ts).
import { getSupabase } from '@/lib/supabase';
import type { FlagReason, ModerationItem, NewFlag, ReviewStatus, UserRole } from './types';

/** Raw row from the list_moderation_queue() RPC (snake_case). */
type QueueRow = {
  review_id: string;
  attraction_id: string;
  status: ReviewStatus;
  flag_count: number;
  reasons: FlagReason[] | null;
  last_flagged_at: string;
};

function toItem(row: QueueRow): ModerationItem {
  return {
    reviewId: row.review_id,
    attractionId: row.attraction_id,
    status: row.status,
    flagCount: Number(row.flag_count),
    reasons: row.reasons ?? [],
    lastFlaggedAt: row.last_flagged_at,
  };
}

/**
 * Persistence boundary for review flags + moderation. User-scoped via RLS;
 * callers never pass a user id. Moderation reads/writes are additionally
 * gated server-side (the RPC and the moderator policy check is_moderator()).
 */
export interface FlagRepository {
  /** Flag a review (one per user per review; idempotent on a duplicate). */
  flag(input: NewFlag): Promise<void>;
  /** Retract the caller's own flag on a review. */
  unflag(reviewId: string): Promise<void>;
  /** Whether the caller has already flagged this review. */
  hasFlagged(reviewId: string): Promise<boolean>;
  /** The caller's role (UI gating only; the server re-checks via RLS). */
  getRole(): Promise<UserRole>;
  /** The moderation queue (RPC raises 'forbidden' for non-moderators). */
  listQueue(): Promise<ModerationItem[]>;
  /** Set a review's status (moderator RLS policy + content-guard trigger). */
  setStatus(reviewId: string, status: ReviewStatus): Promise<void>;
}

async function requireUserId(action: string): Promise<string> {
  const {
    data: { user },
    error,
  } = await getSupabase().auth.getUser();
  if (error) throw error;
  if (!user) throw new Error(`Cannot ${action}: no authenticated user.`);
  return user.id;
}

export const supabaseFlagRepository: FlagRepository = {
  async flag({ reviewId, reason }) {
    const userId = await requireUserId('flag a review');
    const { error } = await getSupabase()
      .from('review_flags')
      .insert({ review_id: reviewId, user_id: userId, reason });
    // 23505 = unique violation = already flagged; idempotent, treat as success.
    if (error && error.code !== '23505') throw error;
  },

  async unflag(reviewId) {
    const userId = await requireUserId('retract a flag');
    const { error } = await getSupabase()
      .from('review_flags')
      .delete()
      .eq('user_id', userId)
      .eq('review_id', reviewId);
    if (error) throw error;
  },

  async hasFlagged(reviewId) {
    // RLS returns only the caller's own flag rows, so a hit means the caller
    // flagged this review.
    const { data, error } = await getSupabase()
      .from('review_flags')
      .select('id')
      .eq('review_id', reviewId)
      .maybeSingle();
    if (error) throw error;
    return data !== null;
  },

  async getRole() {
    const {
      data: { user },
    } = await getSupabase().auth.getUser();
    if (!user) return 'user';
    const { data, error } = await getSupabase()
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw error;
    return (data?.role as UserRole | undefined) ?? 'user';
  },

  async listQueue() {
    const { data, error } = await getSupabase().rpc('list_moderation_queue');
    if (error) throw error;
    return (data as QueueRow[]).map(toItem);
  },

  async setStatus(reviewId, status) {
    const { error } = await getSupabase()
      .from('reviews')
      .update({ status })
      .eq('id', reviewId);
    if (error) throw error;
  },
};
