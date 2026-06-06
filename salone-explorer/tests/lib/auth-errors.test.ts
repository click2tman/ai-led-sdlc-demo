// Unit tests for mapAuthError (SPEC §9.6). Each Supabase auth failure mode
// must resolve to the right errors.auth.* content key; unknown errors fall
// back to the generic key rather than leaking a raw message.
import { describe, it, expect } from 'vitest';
import { mapAuthError } from '@/lib/auth/auth-errors';

describe('mapAuthError', () => {
  it('maps invalid credentials', () => {
    expect(mapAuthError(new Error('Invalid login credentials'))).toBe(
      'errors.auth.invalidCredentials',
    );
  });

  it('maps an already-registered email', () => {
    expect(mapAuthError(new Error('User already registered'))).toBe(
      'errors.auth.emailInUse',
    );
  });

  it('maps a weak password', () => {
    expect(
      mapAuthError(new Error('Password should be at least 6 characters')),
    ).toBe('errors.auth.weakPassword');
  });

  it('maps an invalid email', () => {
    expect(mapAuthError(new Error('Unable to validate email address'))).toBe(
      'errors.auth.emailInvalid',
    );
  });

  it('falls back to generic for an unknown error', () => {
    expect(mapAuthError(new Error('some unexpected failure'))).toBe(
      'errors.auth.generic',
    );
  });

  it('handles non-Error throwables without crashing', () => {
    expect(mapAuthError('boom')).toBe('errors.auth.generic');
  });
});
