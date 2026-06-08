// User-scoped domain types (SPEC §6.3, and §6.6 reviews via ADR 0004).
// Mirror the Supabase tables (profiles, saved_attractions, tour_bookings,
// reviews) as camelCase domain objects. These are the contracts the account
// repositories return and the UI consumes; the snake_case row shapes stay
// private to the repositories.

/** A saved attraction is either a bookmark or a favorite (§6.3 saved_kind). */
export type SavedKind = 'bookmark' | 'favorite';

/** Lifecycle of a tour booking (§6.3 booking_status). */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

/** The signed-in user's profile row (§6.3 public.profiles). */
export type Profile = {
  id: string;
  displayName: string | null;
  createdAt: string;
};

/** A bookmark/favorite link between a user and an attraction (§6.3). */
export type SavedAttraction = {
  id: string;
  attractionId: string;
  kind: SavedKind;
  createdAt: string;
};

/** A scheduled tour booking (§6.3 public.tour_bookings). */
export type TourBooking = {
  id: string;
  attractionId: string;
  /** ISO date (YYYY-MM-DD). */
  tourDate: string;
  /** 1-20 (§6.3 check constraint). */
  partySize: number;
  notes: string | null;
  status: BookingStatus;
  createdAt: string;
};

/** Fields required to create a booking; the rest are server-defaulted. */
export type NewTourBooking = {
  attractionId: string;
  tourDate: string;
  partySize: number;
  notes: string | null;
};

/** Moderation lifecycle of a review (§6.6 reviews.status; ADR 0004 D1). */
export type ReviewStatus = 'published' | 'flagged' | 'removed';

/** A user-authored review of an attraction (§6.6 public.reviews). Phase 9
 * reviews are pseudonymous: no author name is carried (ADR 0004 D6 note). */
export type Review = {
  id: string;
  attractionId: string;
  /** Author's user id. Present only on the caller's own review (getOwn);
   * omitted from public-list rows so visitors never receive others' ids. */
  userId?: string;
  /** 1-5. */
  rating: number;
  body: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
};

/** Fields a user supplies to create a review; the rest are server-defaulted. */
export type NewReview = {
  attractionId: string;
  rating: number;
  body: string;
};

/** Aggregate of published reviews for an attraction (drives aggregateRating). */
export type AttractionRating = {
  mean: number;
  count: number;
};

/** Phase 11 (§6.3) payment lifecycle. Status is written only by the webhook. */
export type PaymentStatus = 'requires_payment' | 'paid' | 'refunded' | 'failed';

export type Payment = {
  id: string;
  bookingId: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
};

/** Phase 9 follow-up (#50, ADR 0009): review flagging + moderator role. */
export type FlagReason = 'spam' | 'offensive' | 'inaccurate' | 'other';
export type UserRole = 'user' | 'moderator';

export type NewFlag = {
  reviewId: string;
  reason: FlagReason;
};

/** A row in the moderator queue (from list_moderation_queue()). */
export type ModerationItem = {
  reviewId: string;
  attractionId: string;
  status: ReviewStatus;
  flagCount: number;
  reasons: FlagReason[];
  lastFlaggedAt: string;
};
