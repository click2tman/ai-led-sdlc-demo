// Unit tests for the booking-email Edge Function's pure logic (ADR 0007):
// the status-transition classifier, the content-layer message composer, and
// the inbound-request guards. The Deno glue (index.ts) is not exercised here;
// these cover the testable _shared/*.ts modules the function delegates to.
import { describe, it, expect } from 'vitest';
import { classifyEvent } from '../../supabase/functions/_shared/classify';
import { composeEmail } from '../../supabase/functions/_shared/compose';
import { t } from '../../supabase/functions/_shared/copy';
import {
  verifyWebhookSecret,
  timingSafeEqual,
  isValidPayload,
} from '../../supabase/functions/_shared/auth';
import type {
  WebhookPayload,
  BookingRow,
} from '../../supabase/functions/_shared/types';

const row = (overrides: Partial<BookingRow> = {}): BookingRow => ({
  id: 'b1',
  user_id: 'u1',
  attraction_id: 'tiwai-island',
  tour_date: '2026-07-01',
  party_size: 2,
  status: 'pending',
  ...overrides,
});

const payload = (overrides: Partial<WebhookPayload> = {}): WebhookPayload => ({
  type: 'INSERT',
  table: 'tour_bookings',
  record: row(),
  old_record: null,
  ...overrides,
});

describe('classifyEvent', () => {
  it('classifies an INSERT as created', () => {
    expect(classifyEvent(payload({ type: 'INSERT' }))).toBe('created');
  });

  it('classifies a transition to cancelled as cancelled', () => {
    expect(
      classifyEvent(
        payload({
          type: 'UPDATE',
          old_record: row({ status: 'pending' }),
          record: row({ status: 'cancelled' }),
        }),
      ),
    ).toBe('cancelled');
  });

  it('ignores a transition to confirmed (operator-only, out of scope)', () => {
    expect(
      classifyEvent(
        payload({
          type: 'UPDATE',
          old_record: row({ status: 'pending' }),
          record: row({ status: 'confirmed' }),
        }),
      ),
    ).toBeNull();
  });

  it('ignores a notes-only edit (no status change)', () => {
    expect(
      classifyEvent(
        payload({
          type: 'UPDATE',
          old_record: row({ status: 'pending' }),
          record: row({ status: 'pending' }),
        }),
      ),
    ).toBeNull();
  });

  it('ignores an already-cancelled row updated again', () => {
    expect(
      classifyEvent(
        payload({
          type: 'UPDATE',
          old_record: row({ status: 'cancelled' }),
          record: row({ status: 'cancelled' }),
        }),
      ),
    ).toBeNull();
  });

  it('ignores DELETE', () => {
    expect(classifyEvent(payload({ type: 'DELETE', record: null }))).toBeNull();
  });
});

describe('composeEmail', () => {
  const details = { attractionName: 'Tiwai Island', tourDate: '2026-07-01', partySize: 2 };

  it('composes the created email from content-layer copy', () => {
    const { subject, text } = composeEmail('created', details);
    expect(subject).toBe('Your Salone Explorer tour request');
    expect(text).toContain('Tour request received');
    expect(text).toContain('Attraction: Tiwai Island');
    expect(text).toContain('Date: 2026-07-01');
    expect(text).toContain('Party size: 2');
  });

  it('composes the cancelled email', () => {
    const { subject, text } = composeEmail('cancelled', details);
    expect(subject).toBe('Your Salone Explorer tour request was cancelled');
    expect(text).toContain('Tour request cancelled');
  });

  it('carries no PII beyond the booking facts (no notes/user_id)', () => {
    const { text } = composeEmail('created', details);
    expect(text).not.toContain('u1');
    expect(text.toLowerCase()).not.toContain('note');
  });
});

describe('webhook auth guards', () => {
  it('timingSafeEqual matches equal strings and rejects others', () => {
    expect(timingSafeEqual('secret', 'secret')).toBe(true);
    expect(timingSafeEqual('secret', 'secres')).toBe(false);
    expect(timingSafeEqual('secret', 'secre')).toBe(false);
  });

  it('verifyWebhookSecret requires both sides non-empty and equal', async () => {
    expect(await verifyWebhookSecret('abc', 'abc')).toBe(true);
    expect(await verifyWebhookSecret('abc', 'xyz')).toBe(false);
    // Different lengths must not match (and must not leak via early exit).
    expect(await verifyWebhookSecret('abc', 'abcd')).toBe(false);
    expect(await verifyWebhookSecret(null, 'abc')).toBe(false);
    expect(await verifyWebhookSecret('abc', undefined)).toBe(false);
  });

  it('isValidPayload accepts a well-formed payload and rejects junk', () => {
    expect(isValidPayload(payload())).toBe(true);
    expect(isValidPayload({ type: 'INSERT' })).toBe(false);
    expect(isValidPayload({ type: 'PURGE', table: 'x', record: null, old_record: null })).toBe(
      false,
    );
    expect(isValidPayload(null)).toBe(false);
    expect(
      isValidPayload({ type: 'INSERT', table: 'tour_bookings', record: { id: 'b1' }, old_record: null }),
    ).toBe(false);
  });

  it('isValidPayload rejects a well-formed payload for another table', () => {
    expect(isValidPayload(payload({ table: 'profiles' }))).toBe(false);
  });
});

describe('email copy', () => {
  it('t() resolves a known key and throws on a missing one', () => {
    expect(t('email.created.subject')).toBe('Your Salone Explorer tour request');
    // @ts-expect-error - unknown key is a type error and a runtime throw.
    expect(() => t('email.nope')).toThrow(/missing key/);
  });
});
