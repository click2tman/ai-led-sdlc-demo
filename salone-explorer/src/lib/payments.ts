// Client payment config + Stripe.js loader (ADR 0008 D7/D8). The deposit flow is
// gated behind VITE_PAYMENTS_ENABLED (default off) and requires
// VITE_STRIPE_PUBLISHABLE_KEY - the ONLY Stripe value in the browser bundle
// (never the secret keys, which are Edge Function secrets). Stripe Checkout is
// hosted: the publishable key initialises Stripe.js (SPEC §3) and the
// create-checkout function returns the redirect url.
import { loadStripe, type Stripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;

/** True only when the deposit flow is enabled and its publishable key is set. */
export function isPaymentsEnabled(): boolean {
  return import.meta.env.VITE_PAYMENTS_ENABLED === 'true' && Boolean(publishableKey);
}

let stripePromise: Promise<Stripe | null> | null = null;

/** Lazily load Stripe.js with the publishable key (singleton). Fail-fast if
 * the key is absent (mirrors getSupabase()'s presence check). */
export function getStripe(): Promise<Stripe | null> {
  if (!publishableKey) {
    throw new Error('VITE_STRIPE_PUBLISHABLE_KEY is not set; cannot start checkout.');
  }
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}
