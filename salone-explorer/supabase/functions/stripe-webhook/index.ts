// stripe-webhook Edge Function (Deno) - Phase 11, ADR 0008 D2/D4/D5. Invoked by
// Stripe. Authenticates by HMAC SIGNATURE over the RAW body (STRIPE_WEBHOOK_SECRET
// via constructEventAsync) - NOT the Phase 10 shared-secret header pattern, and
// the body must not be parsed before verification. On the authoritative paid
// event it marks payments.status='paid' and transitions the booking
// pending->confirmed, both as status-guarded conditional UPDATEs (idempotent
// across Stripe's duplicate/out-of-order deliveries) using the service role.
//
// Deno glue; the pure event classifier lives in ../_shared/stripe-events.ts
// (vitest-covered). Excluded from the app's tsc/eslint (ignores supabase/).
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { classifyStripeEvent, type StripeEventLike } from '../_shared/stripe-events.ts';

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`stripe-webhook: missing required env ${name}`);
  return value;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('missing signature', { status: 400 });

  const stripe = new Stripe(env('STRIPE_SECRET_KEY'), { apiVersion: '2024-12-18.acacia' });

  // Verify the signature over the RAW body BEFORE parsing (re-serialising would
  // break the HMAC). An invalid signature is rejected with no DB write.
  let event: StripeEventLike;
  try {
    const rawBody = await req.text();
    event = (await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      env('STRIPE_WEBHOOK_SECRET'),
    )) as unknown as StripeEventLike;
  } catch (error) {
    console.error('stripe-webhook: signature verification failed', error);
    return new Response('invalid signature', { status: 400 });
  }

  try {
    const outcome = classifyStripeEvent(event);
    if (outcome.kind === 'ignore') {
      return new Response('ignored', { status: 200 });
    }

    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false },
    });

    if (outcome.kind === 'paid') {
      // Conditional UPDATE: only flips a not-yet-paid row. A duplicate or
      // out-of-order delivery that finds it already paid updates zero rows.
      const { data: paidRows } = await admin
        .from('payments')
        .update({ status: 'paid' })
        .eq('stripe_payment_intent_id', outcome.paymentIntentId)
        .neq('status', 'paid')
        .select('id');
      if (paidRows && paidRows.length > 0) {
        // Guarded: cannot clobber a later 'cancelled'.
        await admin
          .from('tour_bookings')
          .update({ status: 'confirmed' })
          .eq('id', outcome.bookingId)
          .eq('status', 'pending');
      }
      return new Response('ok', { status: 200 });
    }

    // outcome.kind === 'failed'
    await admin
      .from('payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', outcome.paymentIntentId)
      .not('status', 'in', '("paid","refunded")');
    return new Response('ok', { status: 200 });
  } catch (error) {
    console.error('stripe-webhook: handler error', error);
    return new Response('internal error', { status: 500 });
  }
});
