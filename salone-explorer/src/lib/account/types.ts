// User-scoped domain types (SPEC §6.3). Mirror the Supabase tables
// profiles, saved_attractions, and tour_bookings as camelCase domain
// objects. These are the contracts the account repositories return and the
// UI consumes; the snake_case row shapes stay private to the repositories.

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
