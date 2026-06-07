// Unit tests for the review-fed JSON-LD path (SPEC §13.3, §14, ADR 0004 D3).
// Mocks the build-time snapshot so aggregateRating + Review nodes come from
// published-review data (overriding the static seed rating), and asserts the
// "<" escaping that prevents a "</script>" breakout from a user review body.
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/data/reviews.snapshot.json', () => ({
  default: {
    'tiwai-island': {
      count: 2,
      mean: 4.5,
      recent: [
        {
          rating: 5,
          // Stored XSS probe: a review body trying to break out of the script.
          body: 'Amazing </script><script>alert(1)</script>',
          createdAt: '2026-06-06T12:00:00Z',
        },
        { rating: 4, body: 'Lovely island.', createdAt: '2026-06-05T12:00:00Z' },
      ],
    },
  },
}));

import { touristAttraction, attractionGraph, serializeJsonLd } from '@/seo/graph';
import type { Attraction } from '@/data/types';

const sample: Attraction = {
  id: 'tiwai-island',
  name: 'Tiwai Island Wildlife Sanctuary',
  shortDescription: 'A river-island sanctuary.',
  longDescription: 'Tiwai Island is a wildlife sanctuary on the Moa River.',
  location: { region: 'Pujehun District', latitude: 7.55, longitude: -11.35 },
  hours: { open: '08:00', close: '17:00', daysOpen: 'Daily' },
  // Static seed values that the snapshot must override.
  rating: 3.0,
  reviewCount: 99,
  images: ['/img/tiwai.jpg'],
  tags: ['wildlife'],
  sources: ['https://example.org/tiwai'],
};

describe('review-fed JSON-LD', () => {
  it('sources aggregateRating from the snapshot, overriding the static seed', () => {
    const node = touristAttraction(sample) as Record<string, Record<string, unknown>>;
    expect(node.aggregateRating).toMatchObject({
      '@type': 'AggregateRating',
      ratingValue: 4.5,
      reviewCount: 2,
    });
  });

  it('attaches a Review node per recent snapshot review', () => {
    const node = touristAttraction(sample) as Record<string, unknown[]>;
    expect(node.review).toHaveLength(2);
    expect(node.review[0]).toMatchObject({
      '@type': 'Review',
      reviewBody: 'Amazing </script><script>alert(1)</script>',
      author: { '@type': 'Person' },
    });
  });

  it('escapes "<" so a review body cannot break out of the JSON-LD script', () => {
    const json = serializeJsonLd(attractionGraph(sample));
    expect(json).not.toContain('</script>');
    expect(json).toContain('\\u003c/script');
  });
});
