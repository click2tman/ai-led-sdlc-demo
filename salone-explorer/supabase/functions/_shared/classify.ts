// Booking -> email-event classifier (ADR 0007 D1). Maps a Database Webhook
// payload to the email it should trigger, evaluating the status transition
// explicitly so notes edits and operator-only transitions do not mis-fire.
// Pure function (no Deno globals) - unit-tested by the app's vitest.
import type { WebhookPayload, BookingEvent } from './types.ts';

/**
 * Classify the email event for a tour_bookings change.
 * - INSERT -> 'created' (bookings are created as status='pending').
 * - UPDATE that transitions status from non-cancelled to 'cancelled' ->
 *   'cancelled'.
 * - Everything else (confirmed transition, notes edits, DELETE) -> null.
 */
export function classifyEvent(payload: WebhookPayload): BookingEvent | null {
  if (payload.type === 'INSERT' && payload.record) {
    return 'created';
  }
  if (
    payload.type === 'UPDATE' &&
    payload.record?.status === 'cancelled' &&
    payload.old_record?.status !== 'cancelled'
  ) {
    return 'cancelled';
  }
  return null;
}
