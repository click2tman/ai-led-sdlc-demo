// Phase 2.5 migration (SPEC §5.3, §19 P2.5). Reads src/data/attractions.json
// and upserts each record into public.attractions. Runs server-side with the
// service-role key (bypasses RLS) - the key is read from the environment and
// never committed or VITE_-prefixed. Idempotent: re-running upserts by id.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { Attraction } from '../src/data/types';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error(
    'Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your shell ' +
      'before running the migration. The service-role key must never be ' +
      'committed or exposed to the browser.',
  );
}

const attractions = JSON.parse(
  readFileSync(resolve(appRoot, 'src/data/attractions.json'), 'utf8'),
) as Attraction[];

const rows = attractions.map((a) => ({
  id: a.id,
  name: a.name,
  short_description: a.shortDescription,
  long_description: a.longDescription,
  region: a.location.region,
  latitude: a.location.latitude,
  longitude: a.location.longitude,
  hours_open: a.hours.open || null,
  hours_close: a.hours.close || null,
  hours_days: a.hours.daysOpen,
  hours_notes: a.hours.notes ?? null,
  rating: a.rating,
  review_count: a.reviewCount,
  images: a.images,
  video_url: a.videoUrl ?? null,
  tags: a.tags,
  sources: a.sources,
  faqs: a.faqs ?? null,
  updated_at: new Date().toISOString(),
}));

async function run(): Promise<void> {
  const supabase = createClient(url as string, serviceRoleKey as string, {
    auth: { persistSession: false },
  });
  const { error } = await supabase
    .from('attractions')
    .upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('migration failed:', error.message);
    process.exit(1);
  }
  console.log(`migrate-attractions: upserted ${rows.length} attractions.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
