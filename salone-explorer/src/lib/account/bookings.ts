// TourBookingRepository contract + Supabase implementation (SPEC §6.3,
// §9.4, §9.5). Bookings are user-scoped rows in public.tour_bookings under
// RLS (auth.uid() = user_id). Creating a booking inserts status='pending';
// cancelling sets status='cancelled' (SPEC §20 Phase 2). Supabase-only data.
import { getSupabase } from '@/lib/supabase';
import type { BookingStatus, NewTourBooking, TourBooking } from './types';

/** Raw public.tour_bookings row (snake_case, §6.3 columns). */
type BookingRow = {
  id: string;
  attraction_id: string;
  tour_date: string;
  party_size: number;
  notes: string | null;
  status: BookingStatus;
  created_at: string;
};

/** Map a database row to the domain TourBooking. */
function toBooking(row: BookingRow): TourBooking {
  return {
    id: row.id,
    attractionId: row.attraction_id,
    tourDate: row.tour_date,
    partySize: row.party_size,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * Persistence boundary for tour bookings. Implementations are user-scoped
 * via RLS; callers never pass a user id.
 */
export interface TourBookingRepository {
  /** All bookings for the signed-in user, soonest tour date first. */
  list(): Promise<TourBooking[]>;
  /** Create a booking (status defaults to 'pending'); returns the new row. */
  create(input: NewTourBooking): Promise<TourBooking>;
  /** Set a booking's status to 'cancelled'. */
  cancel(id: string): Promise<void>;
}

export const supabaseBookingRepository: TourBookingRepository = {
  async list() {
    const { data, error } = await getSupabase()
      .from('tour_bookings')
      .select('id, attraction_id, tour_date, party_size, notes, status, created_at')
      .order('tour_date', { ascending: true });
    if (error) throw error;
    return (data as BookingRow[]).map(toBooking);
  },

  async create(input) {
    const {
      data: { user },
      error: userError,
    } = await getSupabase().auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('Cannot book: no authenticated user.');

    const { data, error } = await getSupabase()
      .from('tour_bookings')
      .insert({
        user_id: user.id,
        attraction_id: input.attractionId,
        tour_date: input.tourDate,
        party_size: input.partySize,
        notes: input.notes,
      })
      .select('id, attraction_id, tour_date, party_size, notes, status, created_at')
      .single();
    if (error) throw error;
    return toBooking(data as BookingRow);
  },

  async cancel(id) {
    const { error } = await getSupabase()
      .from('tour_bookings')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (error) throw error;
  },
};
