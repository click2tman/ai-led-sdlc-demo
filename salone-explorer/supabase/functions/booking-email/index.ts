// booking-email Edge Function (Deno) - Phase 10, ADR 0007. Invoked by a
// Supabase Database Webhook on public.tour_bookings INSERT/UPDATE. Verifies a
// shared WEBHOOK_SECRET (not an open relay), classifies the status transition,
// guards duplicate deliveries via an insert-before-send into email_log, then
// resolves the recipient + attraction name server-side and sends a
// transactional email through the provider. A send failure is logged but never
// mutates the booking and returns 2xx so the webhook does not retry into a
// duplicate. All secrets come from Edge Function env, never the client.
//
// This file is Deno glue (Deno.serve, Deno.env, remote import); the testable
// logic lives in ../_shared/*.ts and is covered by the app's vitest. It is
// excluded from the app's tsc/eslint (eslint.config.js ignores supabase/).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyWebhookSecret, isValidPayload } from '../_shared/auth.ts';
import { classifyEvent } from '../_shared/classify.ts';
import { composeEmail } from '../_shared/compose.ts';
import { resendProvider } from '../_shared/email.ts';

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
  if (!verifyWebhookSecret(req.headers.get('x-webhook-secret'), Deno.env.get('WEBHOOK_SECRET'))) {
    return new Response('unauthorized', { status: 401 });
  }

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
    await markFailed(supabase, booking.id, event);
    return new Response('no recipient', { status: 200 });
  }

  // 6. Resolve the attraction name; fall back to the slug if unavailable.
  const { data: attraction } = await supabase
    .from('attractions')
    .select('name')
    .eq('id', booking.attraction_id)
    .maybeSingle();
  const attractionName = (attraction?.name as string | undefined) ?? booking.attraction_id;

  // 7. Compose from the content-layer copy and send.
  const message = composeEmail(event, {
    attractionName,
    tourDate: booking.tour_date,
    partySize: booking.party_size,
  });
  const provider = resendProvider(env('EMAIL_PROVIDER_API_KEY'), env('EMAIL_FROM'));

  try {
    const { id } = await provider.send({ to, ...message });
    await supabase
      .from('email_log')
      .update({ provider_message_id: id })
      .eq('booking_id', booking.id)
      .eq('event_type', event);
  } catch (error) {
    console.error('booking-email: send failed', error);
    await markFailed(supabase, booking.id, event);
  }

  return new Response('ok', { status: 200 });
});

/** Mark the email_log row failed without touching the booking. */
async function markFailed(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
  event: string,
): Promise<void> {
  await supabase
    .from('email_log')
    .update({ status: 'failed' })
    .eq('booking_id', bookingId)
    .eq('event_type', event);
}
