// Inbound-request guards for the booking-email function (ADR 0007 D4). The
// function is reachable over HTTP, so it must not be an open relay: it
// constant-time-compares a shared WEBHOOK_SECRET and validates the payload
// shape before any service-role work. Pure (no Deno globals) - unit-tested.
import type { WebhookPayload, BookingRow } from './types.ts';

/** Constant-time compare of two EQUAL-length strings (XOR accumulation). */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/** SHA-256 hex of a string (Web Crypto; available in Deno and Node 20+). */
async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * True when `provided` matches the configured secret (both non-empty). Compares
 * fixed-length SHA-256 hex digests so neither the length nor the bytes of the
 * secret leak through comparison timing.
 */
export async function verifyWebhookSecret(
  provided: string | null,
  expected: string | undefined,
): Promise<boolean> {
  if (!provided || !expected) return false;
  return timingSafeEqual(await sha256Hex(provided), await sha256Hex(expected));
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
  // Defence-in-depth: only tour_bookings drives this function, even if the
  // WEBHOOK_SECRET is ever shared with another table's webhook.
  if (payload.table !== 'tour_bookings') return false;
  if (payload.record !== null && !isBookingRow(payload.record)) return false;
  if (payload.old_record !== null && !isBookingRow(payload.old_record)) return false;
  return true;
}
