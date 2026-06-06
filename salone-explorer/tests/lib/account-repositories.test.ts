// Unit tests for the user-scoped repositories (SPEC §6.3, §9.4, §9.5). Verify
// the snake_case<->camelCase mapping and, critically, that writes set user_id
// from the session (satisfying the RLS with-check) and that cancel sets
// status='cancelled'. The Supabase client is mocked with a thenable query
// builder so no network or env is needed.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSupabase } from '@/lib/supabase';
import { savedAttractions, tourBookings } from '@/lib/account';

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(),
  isSupabaseConfigured: vi.fn(() => true),
}));

type Call = [string, unknown[]];

/** A chainable, thenable query-builder mock that records every call. */
function createClient() {
  const calls: Call[] = [];
  let queryResult: { data: unknown; error: unknown } = { data: null, error: null };

  const qb: Record<string, unknown> = {
    then: (resolve: (value: unknown) => unknown) => resolve(queryResult),
  };
  for (const method of [
    'select',
    'eq',
    'order',
    'upsert',
    'insert',
    'update',
    'delete',
    'maybeSingle',
    'single',
  ]) {
    qb[method] = vi.fn((...args: unknown[]) => {
      calls.push([method, args]);
      return qb;
    });
  }

  return {
    from: vi.fn((table: string) => {
      calls.push(['from', [table]]);
      return qb;
    }),
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: 'user-1' } },
        error: null,
      })),
    },
    setResult(result: { data: unknown; error: unknown }) {
      queryResult = result;
    },
    calls,
  };
}

let client: ReturnType<typeof createClient>;

beforeEach(() => {
  client = createClient();
  vi.mocked(getSupabase).mockReturnValue(
    client as unknown as ReturnType<typeof getSupabase>,
  );
});

/** Find the arguments of the first recorded call to a builder method. */
function argsOf(method: string): unknown[] | undefined {
  return client.calls.find(([name]) => name === method)?.[1];
}

/** All recorded argument tuples for a builder method, in call order. */
function allArgsOf(method: string): unknown[][] {
  return client.calls.filter(([name]) => name === method).map(([, args]) => args);
}

describe('savedAttractions repository', () => {
  it('maps rows from listByKind', async () => {
    client.setResult({
      data: [
        {
          id: 'row-1',
          attraction_id: 'tiwai-island',
          kind: 'bookmark',
          created_at: '2026-06-06T00:00:00Z',
        },
      ],
      error: null,
    });
    const rows = await savedAttractions.listByKind('bookmark');
    expect(rows).toEqual([
      {
        id: 'row-1',
        attractionId: 'tiwai-island',
        kind: 'bookmark',
        createdAt: '2026-06-06T00:00:00Z',
      },
    ]);
    expect(argsOf('eq')).toEqual(['kind', 'bookmark']);
  });

  it('isSaved is true when a row exists, false otherwise', async () => {
    client.setResult({ data: { id: 'row-1' }, error: null });
    expect(await savedAttractions.isSaved('tiwai-island', 'favorite')).toBe(true);
    client.setResult({ data: null, error: null });
    expect(await savedAttractions.isSaved('tiwai-island', 'favorite')).toBe(false);
  });

  it('add sets user_id from the session and ignores duplicates', async () => {
    client.setResult({ data: null, error: null });
    await savedAttractions.add('tiwai-island', 'bookmark');
    const [payload, options] = argsOf('upsert') as [
      Record<string, unknown>,
      Record<string, unknown>,
    ];
    expect(payload).toEqual({
      user_id: 'user-1',
      attraction_id: 'tiwai-island',
      kind: 'bookmark',
    });
    expect(options).toMatchObject({ ignoreDuplicates: true });
  });

  it('add throws when there is no authenticated user', async () => {
    client.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    } as never);
    await expect(savedAttractions.add('tiwai-island', 'bookmark')).rejects.toThrow(
      /no authenticated user/,
    );
  });

  it('remove deletes scoped to the user, attraction, and kind', async () => {
    client.setResult({ data: null, error: null });
    await savedAttractions.remove('tiwai-island', 'favorite');
    expect(client.calls).toContainEqual(['delete', []]);
    // Defense in depth: the delete must be filtered by user_id as well as the
    // attraction and kind, so a weakened RLS policy cannot widen its blast.
    expect(allArgsOf('eq')).toEqual([
      ['user_id', 'user-1'],
      ['attraction_id', 'tiwai-island'],
      ['kind', 'favorite'],
    ]);
  });

  it('remove throws when there is no authenticated user', async () => {
    client.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    } as never);
    await expect(
      savedAttractions.remove('tiwai-island', 'favorite'),
    ).rejects.toThrow(/no authenticated user/);
  });
});

describe('tourBookings repository', () => {
  it('create sets user_id and maps the returned row', async () => {
    client.setResult({
      data: {
        id: 'b-1',
        attraction_id: 'tiwai-island',
        tour_date: '2026-07-01',
        party_size: 2,
        notes: null,
        status: 'pending',
        created_at: '2026-06-06T00:00:00Z',
      },
      error: null,
    });
    const booking = await tourBookings.create({
      attractionId: 'tiwai-island',
      tourDate: '2026-07-01',
      partySize: 2,
      notes: null,
    });
    expect(booking.status).toBe('pending');
    expect(booking.attractionId).toBe('tiwai-island');
    expect(argsOf('insert')).toEqual([
      {
        user_id: 'user-1',
        attraction_id: 'tiwai-island',
        tour_date: '2026-07-01',
        party_size: 2,
        notes: null,
      },
    ]);
  });

  it('cancel sets status to cancelled, scoped to the user and id', async () => {
    client.setResult({ data: null, error: null });
    await tourBookings.cancel('b-1');
    expect(argsOf('update')).toEqual([{ status: 'cancelled' }]);
    expect(allArgsOf('eq')).toEqual([
      ['user_id', 'user-1'],
      ['id', 'b-1'],
    ]);
  });

  it('list maps rows soonest-first as returned by the query', async () => {
    client.setResult({
      data: [
        {
          id: 'b-1',
          attraction_id: 'tiwai-island',
          tour_date: '2026-07-01',
          party_size: 4,
          notes: 'window seat',
          status: 'confirmed',
          created_at: '2026-06-06T00:00:00Z',
        },
      ],
      error: null,
    });
    const rows = await tourBookings.list();
    expect(rows[0]).toEqual({
      id: 'b-1',
      attractionId: 'tiwai-island',
      tourDate: '2026-07-01',
      partySize: 4,
      notes: 'window seat',
      status: 'confirmed',
      createdAt: '2026-06-06T00:00:00Z',
    });
  });
});
