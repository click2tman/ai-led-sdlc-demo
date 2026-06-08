// booking-email Edge Function (Deno) - Phase 10, ADR 0007. Invoked by a
// Supabase Database Webhook on public.tour_bookings INSERT/UPDATE. Verifies a
// shared WEBHOOK_SECRET (not an open relay), classifies the status transition,
// guards duplicate deliveries via an insert-before-send into email_log, then
// resolves the recipient + attraction name server-side and sends a
// transactional email through the provider. On a send failure it releases the
// idempotency claim (so a manual webhook re-drive can retry) and returns 2xx so
// Supabase does not auto-retry into a possible duplicate. All secrets come from
// Edge Function env, never the client. Errors after the auth gate return a
// generic 500 with no internal detail.
//
// This file is Deno glue (Deno.serve, Deno.env, import map); the testable logic
// lives in ../_shared/*.ts and is covered by the app's vitest. It is excluded
// from the app's tsc/eslint (eslint.config.js ignores supabase/).
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { verifyWebhookSecret, isValidPayload } from '../_shared/auth.ts';
import { classifyEvent } from '../_shared/classify.ts';
import { composeEmail } from '../_shared/compose.ts';
import { resendProvider } from '../_shared/email.ts';
import { t } from '../_shared/copy.ts';

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`booking-email: missing required env ${name}`);
  return value;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  // 1. Authenticate the inbound webhook before any work.
  if (!(await verifyWebhookSecret(req.headers.get('x-webhook-secret'), Deno.env.get('WEBHOOK_SECRET')))) {
    return new Response('unauthorized', { status: 401 });
  }

  try {
    // 2. Validate the payload shape.
    const body: unknown = await req.json().catch(() => null);
    if (!isValidPayload(body)) {
      return new Response('bad request', { status: 400 });
    }

    // 3. Classify; ignore transitions that do not send mail.
    const event = classifyEvent(body);
    const booking = body.record;
    if (!event || !booking) {
      return new Response('ignored', { status: 200 });
    }

    const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false },
    });

    // 4. Idempotency guard: insert-before-send. A duplicate webhook delivery
    // hits the unique(booking_id, event_type) constraint and exits early.
    const { error: logError } = await supabase
      .from('email_log')
      .insert({ user_id: booking.user_id, booking_id: booking.id, event_type: event });
    if (logError) {
      if (logError.code === '23505') {
        return new Response('already sent', { status: 200 });
      }
      throw logError;
    }

    // 5. Resolve recipient server-side (never exposed to the client).
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      booking.user_id,
    );
    const to = userData?.user?.email;
    if (userError || !to) {
      // Release the claim so a later re-drive can retry once an email exists.
      await releaseClaim(supabase, booking.id, event);
      return new Response('no recipient', { status: 200 });
    }

    // 6. Resolve the attraction name; fall back to a generic content-layer
    // label (never the raw slug) if the attractions table is absent/empty.
    const { data: attraction } = await supabase
      .from('attractions')
      .select('name')
      .eq('id', booking.attraction_id)
      .maybeSingle();
    const attractionName = (attraction?.name as string | undefined) ?? null;
    if (!attractionName) {
      console.warn(`booking-email: no attraction name for ${booking.attraction_id}; using fallback`);
    }

    // 7. Compose from the content-layer copy and send.
    const message = composeEmail(event, {
      attractionName: attractionName ?? t('email.details.attraction.unknown'),
      tourDate: booking.tour_date,
      partySize: booking.party_size,
    });
    const provider = resendProvider(env('EMAIL_PROVIDER_API_KEY'), env('EMAIL_FROM'));

    try {
      const { id } = await provider.send({ to, ...message });
      // Best-effort: record the provider id. A failure here must NOT undo a
      // delivered email, so it is logged but never releases the claim.
      const { error: updateError } = await supabase
        .from('email_log')
        .update({ provider_message_id: id })
        .eq('booking_id', booking.id)
        .eq('event_type', event);
      if (updateError) {
        console.error('booking-email: provider_message_id update failed (email was sent)', updateError);
      }
    } catch (sendError) {
      console.error('booking-email: send failed', sendError);
      // Release the claim so the webhook can be manually re-driven. Return 2xx
      // so Supabase does not auto-retry into a possible duplicate send.
      await releaseClaim(supabase, booking.id, event);
    }

    return new Response('ok', { status: 200 });
  } catch (error) {
    console.error('booking-email: unhandled error', error);
    return new Response('internal error', { status: 500 });
  }
});

/** Delete the idempotency-claim row so a future delivery can retry. A failed
 * delete leaves the claim in place and would block a re-drive as "already
 * sent", so surface it for operator attention. */
async function releaseClaim(
  supabase: SupabaseClient,
  bookingId: string,
  event: string,
): Promise<void> {
  const { error } = await supabase
    .from('email_log')
    .delete()
    .eq('booking_id', bookingId)
    .eq('event_type', event);
  if (error) {
    console.error(
      `booking-email: failed to release email_log claim for ${bookingId}/${event}; a re-drive may be blocked`,
      error,
    );
  }
}
