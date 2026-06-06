// Map Supabase auth errors to content-layer keys (SPEC §9.6: "Errors mapped
// from errors.auth.* keys"). Keeps English copy out of components - the UI
// renders t(mapAuthError(err)). Matching is by Supabase error code/message
// because the JS client does not expose stable typed error variants.
import type { StringKey } from '@/lib/content';

/**
 * Resolve an unknown thrown auth error to an errors.auth.* content key.
 * Unrecognised errors fall back to the generic key rather than leaking a raw
 * Supabase message into the UI.
 *
 * @param error - the value thrown by an AuthProvider method
 */
export function mapAuthError(error: unknown): StringKey {
  const message = (error instanceof Error ? error.message : String(error))
    .toLowerCase();
  // Supabase AuthApiError also carries a stable `code` string and HTTP
  // `status`; read them defensively for cases the message wording is vague on.
  const record =
    typeof error === 'object' && error !== null
      ? (error as Record<string, unknown>)
      : {};
  const code = typeof record.code === 'string' ? record.code.toLowerCase() : '';
  const status = typeof record.status === 'number' ? record.status : 0;

  // Rate limiting (e.g. over_email_send_rate_limit / HTTP 429): tell the user
  // to wait rather than implying their credentials were wrong.
  if (
    status === 429 ||
    code.includes('rate_limit') ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  ) {
    return 'errors.auth.rateLimit';
  }

  if (message.includes('invalid login credentials')) {
    return 'errors.auth.invalidCredentials';
  }
  if (
    message.includes('already registered') ||
    message.includes('already been registered') ||
    message.includes('user already exists')
  ) {
    return 'errors.auth.emailInUse';
  }
  if (
    message.includes('password should be') ||
    message.includes('weak password') ||
    message.includes('password is too short')
  ) {
    return 'errors.auth.weakPassword';
  }
  if (message.includes('unable to validate email') || message.includes('invalid email')) {
    return 'errors.auth.emailInvalid';
  }
  if (message.includes('not configured')) {
    return 'errors.auth.generic';
  }
  return 'errors.auth.generic';
}
