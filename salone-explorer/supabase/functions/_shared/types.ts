// Shared types for the booking-email Edge Function (ADR 0007). The webhook
// payload shape is what Supabase Database Webhooks POST for a row change.
// Pure types (no Deno globals) so the app's vitest + tsc cover the logic.

/** The tour_bookings columns the email path needs (subset of §6.3). */
export type BookingRow = {
  id: string;
  user_id: string;
  attraction_id: string;
  tour_date: string;
  party_size: number;
  status: string;
};

/** Supabase Database Webhook payload for an INSERT/UPDATE/DELETE. */
export type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: BookingRow | null;
  old_record: BookingRow | null;
};

/** The two Phase 10 email events. */
export type BookingEvent = 'created' | 'cancelled';
