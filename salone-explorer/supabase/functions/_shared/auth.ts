// Inbound-request guards for the booking-email function (ADR 0007 D4). The
// function is reachable over HTTP, so it must not be an open relay: it
// constant-time-compares a shared WEBHOOK_SECRET and validates the payload
// shape before any service-role work. Pure (no Deno globals) - unit-tested.
import type { WebhookPayload, BookingRow } from './types.ts';

/**
 * Length-aware constant-time string compare. Avoids early-exit timing leaks
 * on the secret body (length is not itself secret for a fixed-length token).
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** True when `provided` matches the configured secret (both non-empty). */
export function verifyWebhookSecret(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  return timingSafeEqual(provided, expected);
}

function isBookingRow(value: unknown): value is BookingRow {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.user_id === 'string' &&
    typeof row.attraction_id === 'string' &&
    typeof row.tour_date === 'string' &&
    typeof row.party_size === 'number' &&
    typeof row.status === 'string'
  );
}

/** Validate the Database Webhook payload shape (fail fast on anything else). */
export function isValidPayload(body: unknown): body is WebhookPayload {
  if (typeof body !== 'object' || body === null) return false;
  const payload = body as Record<string, unknown>;
  if (payload.type !== 'INSERT' && payload.type !== 'UPDATE' && payload.type !== 'DELETE') {
    return false;
  }
  if (typeof payload.table !== 'string') return false;
  if (payload.record !== null && !isBookingRow(payload.record)) return false;
  if (payload.old_record !== null && !isBookingRow(payload.old_record)) return false;
  return true;
}
