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
