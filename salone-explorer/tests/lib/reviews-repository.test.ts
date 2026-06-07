// Unit tests for the ReviewRepository (SPEC §6.6, §9.3, ADR 0004). Verify the
// snake_case<->camelCase mapping, that reads filter to published, that writes
// set/filter user_id from the session (RLS with-check + defense in depth), and
// that subscribe no-ops when Supabase is unconfigured (SSG safety).
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { reviews } from '@/lib/account';

vi.mock('@/lib/supabase', () => ({
  getSupabase: vi.fn(),
  isSupabaseConfigured: vi.fn(() => true),
}));

type Call = [string, unknown[]];

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
  const channelObj = {
    on: vi.fn(() => channelObj),
    subscribe: vi.fn(() => channelObj),
  };
  return {
    from: vi.fn((table: string) => {
      calls.push(['from', [table]]);
      return qb;
    }),
    channel: vi.fn((name: string) => {
      calls.push(['channel', [name]]);
      return channelObj;
    }),
    removeChannel: vi.fn(),
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })),
    },
    setResult(result: { data: unknown; error: unknown }) {
      queryResult = result;
    },
    calls,
  };
}

let client: ReturnType<typeof createClient>;

beforeEach(() => {
  vi.mocked(isSupabaseConfigured).mockReturnValue(true);
  client = createClient();
  vi.mocked(getSupabase).mockReturnValue(
    client as unknown as ReturnType<typeof getSupabase>,
  );
});

function allArgsOf(method: string): unknown[][] {
  return client.calls.filter(([name]) => name === method).map(([, args]) => args);
}

const row = {
  id: 'r-1',
  user_id: 'user-2',
  attraction_id: 'tiwai-island',
  rating: 5,
  body: 'Wonderful primate sightings.',
  status: 'published',
  created_at: '2026-06-06T00:00:00Z',
  updated_at: '2026-06-06T00:00:00Z',
};

describe('reviews repository', () => {
  it('listPublished filters to published and maps rows', async () => {
    client.setResult({ data: [row], error: null });
    const result = await reviews.listPublished('tiwai-island');
    expect(result[0]).toEqual({
      id: 'r-1',
      userId: 'user-2',
      attractionId: 'tiwai-island',
      rating: 5,
      body: 'Wonderful primate sightings.',
      status: 'published',
      createdAt: '2026-06-06T00:00:00Z',
      updatedAt: '2026-06-06T00:00:00Z',
    });
    expect(allArgsOf('eq')).toEqual([
      ['attraction_id', 'tiwai-island'],
      ['status', 'published'],
    ]);
  });

  it('listPublished never selects user_id (no other-user ids leak)', async () => {
    client.setResult({ data: [], error: null });
    await reviews.listPublished('tiwai-island');
    const [columns] = allArgsOf('select')[0] as [string];
    expect(columns).not.toContain('user_id');
  });

  it('getOwn returns the caller review of any status, scoped to the user', async () => {
    client.setResult({ data: { ...row, user_id: 'user-1', status: 'flagged' }, error: null });
    const result = await reviews.getOwn('tiwai-island');
    expect(result?.status).toBe('flagged');
    expect(result?.userId).toBe('user-1');
    expect(allArgsOf('eq')).toEqual([
      ['attraction_id', 'tiwai-island'],
      ['user_id', 'user-1'],
    ]);
  });

  it('create sets user_id from the session', async () => {
    client.setResult({ data: { ...row, user_id: 'user-1' }, error: null });
    await reviews.create({ attractionId: 'tiwai-island', rating: 4, body: 'Great trip.' });
    const [payload] = allArgsOf('insert')[0] as [Record<string, unknown>];
    expect(payload).toEqual({
      user_id: 'user-1',
      attraction_id: 'tiwai-island',
      rating: 4,
      body: 'Great trip.',
    });
  });

  it('updateOwn filters by id and the session user_id', async () => {
    client.setResult({ data: row, error: null });
    await reviews.updateOwn('r-1', { rating: 3 });
    expect(allArgsOf('update')[0]).toEqual([{ rating: 3 }]);
    expect(allArgsOf('eq')).toEqual([
      ['id', 'r-1'],
      ['user_id', 'user-1'],
    ]);
  });

  it('deleteOwn filters by id and the session user_id', async () => {
    client.setResult({ data: null, error: null });
    await reviews.deleteOwn('r-1');
    expect(client.calls).toContainEqual(['delete', []]);
    expect(allArgsOf('eq')).toEqual([
      ['id', 'r-1'],
      ['user_id', 'user-1'],
    ]);
  });

  it('subscribe no-ops (no channel) when Supabase is unconfigured', () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);
    const teardown = reviews.subscribe('tiwai-island', () => {});
    expect(typeof teardown).toBe('function');
    expect(client.calls.find(([n]) => n === 'channel')).toBeUndefined();
    teardown();
  });

  it('subscribe opens a Realtime channel when configured', () => {
    const teardown = reviews.subscribe('tiwai-island', () => {});
    expect(client.channel).toHaveBeenCalledWith('reviews:tiwai-island');
    teardown();
    expect(client.removeChannel).toHaveBeenCalled();
  });
});
