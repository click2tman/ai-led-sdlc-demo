// Supabase-backed AttractionRepository (Phase 2.5, SPEC §5.3). Reads the
// public.attractions table and maps snake_case rows to the camelCase
// Attraction type. Selected by the barrel when VITE_ATTRACTIONS_SOURCE=
// supabase; produces identical pages to the file repository with no UI change.
import { getSupabase } from '@/lib/supabase';
import type { Attraction, AttractionFaq } from '@/data/types';
import type { AttractionRepository } from './attractions';

/** Raw public.attractions row shape (SPEC §5.3 columns). */
type AttractionRow = {
  id: string;
  name: string;
  short_description: string;
  long_description: string;
  region: string;
  latitude: number;
  longitude: number;
  hours_open: string | null;
  hours_close: string | null;
  hours_days: string | null;
  hours_notes: string | null;
  rating: number | null;
  review_count: number | null;
  images: string[] | null;
  video_url: string | null;
  tags: string[] | null;
  sources: string[] | null;
  faqs: AttractionFaq[] | null;
};

/** Normalise a Postgres `time` value (HH:MM:SS) to HH:MM. */
function toHm(value: string | null): string {
  return value ? value.slice(0, 5) : '';
}

/** Map a database row to the domain Attraction, validating required fields. */
function toAttraction(row: AttractionRow): Attraction {
  if (!row.id || !row.name) {
    throw new Error('attractions row is missing a required id or name.');
  }
  return {
    id: row.id,
    name: row.name,
    shortDescription: row.short_description,
    longDescription: row.long_description,
    location: {
      region: row.region,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    },
    hours: {
      open: toHm(row.hours_open),
      close: toHm(row.hours_close),
      daysOpen: row.hours_days ?? '',
      notes: row.hours_notes ?? undefined,
    },
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    images: row.images ?? [],
    videoUrl: row.video_url ?? undefined,
    tags: row.tags ?? [],
    sources: row.sources ?? [],
    faqs: row.faqs ?? undefined,
  };
}

export const supabaseAttractionRepository: AttractionRepository = {
  async getAll() {
    const { data, error } = await getSupabase()
      .from('attractions')
      .select('*')
      .order('name');
    if (error) throw error;
    return (data as AttractionRow[]).map(toAttraction);
  },
  async getById(id) {
    const { data, error } = await getSupabase()
      .from('attractions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? toAttraction(data as AttractionRow) : null;
  },
};
