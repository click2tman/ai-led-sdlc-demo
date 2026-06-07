// create-checkout Edge Function (Deno) - Phase 11, ADR 0008 D2/D3. Called by
// the SPA via supabase.functions.invoke with the user's JWT. Authenticates the
// USER, verifies they OWN the referenced booking (RLS-scoped read), computes the
// deposit amount SERVER-SIDE (never from the client), creates a Stripe Checkout
// Session, persists a payments row (requires_payment) + its payment_intent id,
// and returns the hosted Checkout url. Holds STRIPE_SECRET_KEY. The paid state
// is set only later by the signature-verified stripe-webhook - never here.
//
// Deno glue; pure config/logic lives in ../_shared/*.ts (vitest-covered). This
// file is excluded from the app's tsc/eslint (eslint.config.js ignores supabase/).
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { corsHeaders } from '../_shared/cors.ts';
import {
  DEPOSIT_AMOUNT_CENTS,
  DEPOSIT_CURRENCY,
  DEPOSIT_PRODUCT_NAME,
} from '../_shared/payments-config.ts';

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`create-checkout: missing required env ${name}`);
  return value;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  try {
    // 1. Authenticate the user from the forwarded JWT.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'unauthorized' }, 401);
    const userClient = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return json({ error: 'unauthorized' }, 401);

    // 2. Validate input.
    const body: unknown = await req.json().catch(() => null);
    const bookingId =
      body && typeof body === 'object' ? (body as Record<string, unknown>).bookingId : null;
    if (typeof bookingId !== 'string') {
      return json({ error: 'bookingId required' }, 400);
    }

    // 3. Verify ownership: the RLS-scoped read only returns the user's bookings.
    const { data: booking } = await userClient
      .from('tour_bookings')
      .select('id, status')
      .eq('id', bookingId)
      .maybeSingle();
    if (!booking) return json({ error: 'booking not found' }, 404);
    if (booking.status === 'cancelled') return json({ error: 'booking is cancelled' }, 409);
    if (booking.status === 'confirmed') return json({ error: 'booking already paid' }, 409);

    // 4. Reject a second checkout for a booking that already has an active or
    // paid payment (defence in depth above the partial unique index in 0004).
    const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false },
    });
    const { data: existing } = await admin
      .from('payments')
      .select('id')
      .eq('booking_id', bookingId)
      .in('status', ['requires_payment', 'paid'])
      .maybeSingle();
    if (existing) return json({ error: 'payment already in progress' }, 409);

    // 5. Create the Stripe Checkout Session FIRST (server holds STRIPE_SECRET_KEY),
    // so the payments row can be inserted in ONE statement already carrying the
    // payment_intent id - no NULL window for a fast webhook to miss.
    const stripe = new Stripe(env('STRIPE_SECRET_KEY'), { apiVersion: '2024-12-18.acacia' });
    const siteUrl = env('SITE_URL');
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: DEPOSIT_CURRENCY,
            unit_amount: DEPOSIT_AMOUNT_CENTS,
            product_data: { name: DEPOSIT_PRODUCT_NAME },
          },
        },
      ],
      metadata: { booking_id: bookingId, user_id: user.id },
      payment_intent_data: { metadata: { booking_id: bookingId } },
      success_url: `${siteUrl}/account?tour=paid&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/account?tour=cancelled`,
    });
    const paymentIntentId =
      typeof session.payment_intent === 'string' ? session.payment_intent : null;
    if (!session.url || !paymentIntentId) {
      throw new Error('Stripe session missing url or payment_intent');
    }

    // 6. Atomic insert with the intent id already set (the unique constraint on
    // stripe_payment_intent_id + the 0004 partial index resolve any race).
    const { error: insertError } = await admin.from('payments').insert({
      user_id: user.id,
      booking_id: bookingId,
      amount_cents: DEPOSIT_AMOUNT_CENTS,
      currency: DEPOSIT_CURRENCY,
      stripe_payment_intent_id: paymentIntentId,
    });
    if (insertError) throw insertError;

    return json({ url: session.url }, 200);
  } catch (error) {
    console.error('create-checkout: unhandled error', error);
    return json({ error: 'internal error' }, 500);
  }
});
