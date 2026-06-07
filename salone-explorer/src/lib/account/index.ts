// Account repositories barrel (SPEC §5.2.3 pattern, §6.3). Single import
// surface for user-scoped persistence: `import { savedAttractions,
// tourBookings } from '@/lib/account'`. These are Supabase-only (user data
// has no file backend); selecting an implementation is trivial today but the
// indirection keeps the UI decoupled from the data source like the
// attractions barrel.
import { supabaseSavedRepository } from './saved';
import { supabaseBookingRepository } from './bookings';
import { supabaseReviewRepository } from './reviews';
import type { SavedAttractionRepository } from './saved';
import type { TourBookingRepository } from './bookings';
import type { ReviewRepository } from './reviews';

export const savedAttractions: SavedAttractionRepository =
  supabaseSavedRepository;
export const tourBookings: TourBookingRepository = supabaseBookingRepository;
export const reviews: ReviewRepository = supabaseReviewRepository;

export type { SavedAttractionRepository } from './saved';
export type { TourBookingRepository } from './bookings';
export type { ReviewRepository, ReviewPatch } from './reviews';
export type {
  Profile,
  SavedAttraction,
  SavedKind,
  TourBooking,
  NewTourBooking,
  BookingStatus,
  Review,
  NewReview,
  ReviewStatus,
  AttractionRating,
} from './types';
