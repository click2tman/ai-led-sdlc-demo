// PaymentRepository contract + Supabase implementation (SPEC §6.3, §9.4;
// ADR 0008). startCheckout invokes the create-checkout Edge Function (which
// holds STRIPE_SECRET_KEY and computes the amount server-side) and returns the
// hosted Stripe Checkout url. getForBooking reads the user's own payment rows
// under RLS (own-row read; status is never client-writable). The client never
// sets an amount or a status.
import { getSupabase } from '@/lib/supabase';
import type { Payment, PaymentStatus } from './types';

/** Raw public.payments row (snake_case, §6.3 columns). */
type PaymentRow = {
  id: string;
  booking_id: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
};

function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    bookingId: row.booking_id,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * Persistence boundary for tour-deposit payments. Implementations are
 * user-scoped via RLS; callers never pass a user id or an amount.
 */
export interface PaymentRepository {
  /** Start Stripe Checkout for a booking; returns the hosted Checkout url. */
  startCheckout(bookingId: string): Promise<{ url: string }>;
  /** The latest payment for a booking, or null. Own-row read under RLS. */
  getForBooking(bookingId: string): Promise<Payment | null>;
}

export const supabasePaymentRepository: PaymentRepository = {
  async startCheckout(bookingId) {
    const { data, error } = await getSupabase().functions.invoke('create-checkout', {
      body: { bookingId },
    });
    if (error) throw error;
    const url = (data as { url?: string } | null)?.url;
    if (!url) throw new Error('Checkout did not return a url.');
    return { url };
  },

  async getForBooking(bookingId) {
    const { data, error } = await getSupabase()
      .from('payments')
      .select('id, booking_id, amount_cents, currency, status, created_at')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? toPayment(data as PaymentRow) : null;
  },
};
