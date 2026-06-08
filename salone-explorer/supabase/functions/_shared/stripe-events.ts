// Stripe webhook event -> payment outcome classifier (ADR 0008 D5). Pure logic
// over an ALREADY-VERIFIED Stripe event (index.ts does the signature check and
// the conditional DB writes). checkout.session.completed with
// payment_status='paid' is the single authoritative paid event;
// payment_intent.payment_failed / checkout.session.expired mark failed. Pure (no
// Deno globals) - unit-tested by the app's vitest.

export type PaymentOutcome =
  | { kind: 'paid'; paymentIntentId: string; bookingId: string }
  | { kind: 'failed'; paymentIntentId: string }
  | { kind: 'ignore' };

/** Minimal shape of the verified Stripe event we read. */
export type StripeEventLike = {
  type: string;
  data: { object: Record<string, unknown> };
};

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function classifyStripeEvent(event: StripeEventLike): PaymentOutcome {
  const object = event.data.object;

  if (event.type === 'checkout.session.completed') {
    if (object.payment_status !== 'paid') return { kind: 'ignore' };
    const paymentIntentId = asString(object.payment_intent);
    const metadata = object.metadata as Record<string, unknown> | undefined;
    const bookingId = asString(metadata?.booking_id);
    if (paymentIntentId && bookingId) {
      return { kind: 'paid', paymentIntentId, bookingId };
    }
    return { kind: 'ignore' };
  }

  if (event.type === 'payment_intent.payment_failed') {
    // For this event the object IS the PaymentIntent.
    const paymentIntentId = asString(object.id);
    if (paymentIntentId) return { kind: 'failed', paymentIntentId };
  }

  if (event.type === 'checkout.session.expired') {
    const paymentIntentId = asString(object.payment_intent);
    if (paymentIntentId) return { kind: 'failed', paymentIntentId };
  }

  return { kind: 'ignore' };
}
