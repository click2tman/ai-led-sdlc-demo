// Unit tests for the Stripe webhook event classifier (ADR 0008 D5). The Deno
// glue (stripe-webhook/index.ts) does signature verification + the conditional
// DB writes; this covers the pure classification of an already-verified event.
import { describe, it, expect } from 'vitest';
import {
  classifyStripeEvent,
  type StripeEventLike,
} from '../../supabase/functions/_shared/stripe-events';

const event = (type: string, object: Record<string, unknown>): StripeEventLike => ({
  type,
  data: { object },
});

describe('classifyStripeEvent', () => {
  it('classifies a completed+paid checkout session as paid', () => {
    expect(
      classifyStripeEvent(
        event('checkout.session.completed', {
          payment_status: 'paid',
          payment_intent: 'pi_123',
          metadata: { booking_id: 'b1' },
        }),
      ),
    ).toEqual({ kind: 'paid', paymentIntentId: 'pi_123', bookingId: 'b1' });
  });

  it('ignores a completed session that is not paid', () => {
    expect(
      classifyStripeEvent(
        event('checkout.session.completed', {
          payment_status: 'unpaid',
          payment_intent: 'pi_123',
          metadata: { booking_id: 'b1' },
        }),
      ),
    ).toEqual({ kind: 'ignore' });
  });

  it('ignores a paid session missing the booking metadata or intent', () => {
    expect(
      classifyStripeEvent(
        event('checkout.session.completed', { payment_status: 'paid', payment_intent: 'pi_1' }),
      ),
    ).toEqual({ kind: 'ignore' });
    expect(
      classifyStripeEvent(
        event('checkout.session.completed', {
          payment_status: 'paid',
          metadata: { booking_id: 'b1' },
        }),
      ),
    ).toEqual({ kind: 'ignore' });
  });

  it('classifies a failed payment intent as failed', () => {
    expect(classifyStripeEvent(event('payment_intent.payment_failed', { id: 'pi_9' }))).toEqual({
      kind: 'failed',
      paymentIntentId: 'pi_9',
    });
  });

  it('classifies an expired checkout session as failed', () => {
    expect(
      classifyStripeEvent(event('checkout.session.expired', { payment_intent: 'pi_7' })),
    ).toEqual({ kind: 'failed', paymentIntentId: 'pi_7' });
  });

  it('ignores unrelated events', () => {
    expect(classifyStripeEvent(event('customer.created', { id: 'cus_1' }))).toEqual({
      kind: 'ignore',
    });
  });
});
