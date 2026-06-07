// CORS headers for browser-invoked Edge Functions (ADR 0008). create-checkout
// is called from the SPA via supabase.functions.invoke and needs these on the
// preflight + response. The stripe-webhook is server-to-server (Stripe) and
// does not use them.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
