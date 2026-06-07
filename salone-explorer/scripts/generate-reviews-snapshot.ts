// Build-time reviews snapshot generator (SPEC §13.3, §14, ADR 0004 D3).
// Reads PUBLISHED reviews and writes per-attraction aggregates +
// newest-5 to src/data/reviews.snapshot.json, which graph.ts bakes into the
// prerendered JSON-LD (aggregateRating + Review nodes) so answer engines
// crawl real ratings. Published reviews are public-read via RLS, so this uses
// the ANON key already present in the build env - NO service-role secret
// (refines ADR R1). When Supabase is unconfigured it writes an empty snapshot
// so graph.ts falls back to the static attraction.rating and the build never
// fails. Run before the bundle in package.json build.
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const outPath = resolve(appRoot, 'src/data/reviews.snapshot.json');
const MAX_NODES = 5;

// Load .env.local as a fallback for local runs (same as the migration script).
const envLocal = resolve(appRoot, '.env.local');
if (
  !process.env.VITE_SUPABASE_URL &&
  typeof process.loadEnvFile === 'function' &&
  existsSync(envLocal)
) {
  process.loadEnvFile(envLocal);
}

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

type ReviewRow = {
  attraction_id: string;
  rating: number;
  body: string;
  created_at: string;
};

type AttractionSnapshot = {
  count: number;
  mean: number;
  recent: { rating: number; body: string; createdAt: string }[];
};

/** Write the snapshot, replacing the file atomically (sorted keys for diffs). */
function write(snapshot: Record<string, AttractionSnapshot>): void {
  const sorted = Object.fromEntries(
    Object.entries(snapshot).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(outPath, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');
}

async function run(): Promise<void> {
  if (!url || !anonKey) {
    // Unconfigured (local/CI without Supabase): empty snapshot -> graph.ts
    // falls back to the static attraction.rating. Never fail the build.
    write({});
    console.log('generate-reviews-snapshot: no Supabase env; wrote empty snapshot.');
    return;
  }

  const supabase = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from('reviews')
    .select('attraction_id, rating, body, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error) {
    // The build must never fail for lack of live review data (ADR 0004 D3).
    // The reviews table may not exist yet during a rollout (migration not yet
    // applied -> PGRST205), or the read may fail transiently. Degrade to an
    // empty snapshot (static rating fallback) and surface the cause loudly.
    write({});
    console.warn(
      `generate-reviews-snapshot: read failed (${error.code ?? 'unknown'}: ${error.message}); ` +
        'wrote empty snapshot, JSON-LD falls back to static rating.',
    );
    return;
  }

  const rows = (data ?? []) as ReviewRow[];
  const byAttraction = new Map<string, ReviewRow[]>();
  for (const row of rows) {
    const list = byAttraction.get(row.attraction_id) ?? [];
    list.push(row);
    byAttraction.set(row.attraction_id, list);
  }

  const snapshot: Record<string, AttractionSnapshot> = {};
  for (const [attractionId, list] of byAttraction) {
    const count = list.length;
    const mean =
      Math.round((list.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10;
    snapshot[attractionId] = {
      count,
      mean,
      recent: list.slice(0, MAX_NODES).map((r) => ({
        rating: r.rating,
        body: r.body,
        createdAt: r.created_at,
      })),
    };
  }

  write(snapshot);
  console.log(
    `generate-reviews-snapshot: ${rows.length} published reviews across ${byAttraction.size} attractions.`,
  );
}

run().catch((error) => {
  // A read failure must not break the deploy: keep the existing snapshot
  // (or the committed empty default) and surface the error loudly.
  console.error('generate-reviews-snapshot failed:', error);
  process.exit(1);
});
