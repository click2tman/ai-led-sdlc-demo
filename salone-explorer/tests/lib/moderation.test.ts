// Unit test for the moderation-queue row mapping (issue #50, ADR 0009). The
// RLS/trigger security boundary needs a live Postgres (issue #39); this covers
// the pure snake_case -> camelCase transform and its null/coercion edge cases.
import { describe, it, expect } from 'vitest';
import { toItem, type QueueRow } from '../../src/lib/account/flags';

const row: QueueRow = {
  review_id: 'r1',
  attraction_id: 'tiwai-island',
  body: 'Great place',
  status: 'flagged',
  flag_count: 3,
  reasons: ['spam', 'other'],
  last_flagged_at: '2026-07-01T00:00:00Z',
};

describe('toItem (moderation queue mapping)', () => {
  it('maps snake_case columns to the camelCase ModerationItem', () => {
    expect(toItem(row)).toEqual({
      reviewId: 'r1',
      attractionId: 'tiwai-island',
      body: 'Great place',
      status: 'flagged',
      flagCount: 3,
      reasons: ['spam', 'other'],
      lastFlaggedAt: '2026-07-01T00:00:00Z',
    });
  });

  it('defaults null reasons to an empty array', () => {
    expect(toItem({ ...row, reasons: null }).reasons).toEqual([]);
  });

  it('coerces a numeric-string flag_count to a number', () => {
    expect(toItem({ ...row, flag_count: '5' as unknown as number }).flagCount).toBe(5);
  });
});
