// Unit tests for the JSON-LD graph builders (SPEC §14, AEO §13.3). Guards the
// answer-engine contract: the attraction node carries a SpeakableSpecification
// over the lead + facts, aggregateRating reflects review data, and the FAQ
// page emits self-contained Question/Answer pairs.
import { describe, it, expect } from 'vitest';
import { attractionGraph, touristAttraction } from '@/seo/graph';
import type { Attraction } from '@/data/types';

const sample: Attraction = {
  id: 'tiwai-island',
  name: 'Tiwai Island Wildlife Sanctuary',
  shortDescription: 'A river-island sanctuary with dense primate populations.',
  longDescription: 'Tiwai Island is a wildlife sanctuary on the Moa River.',
  location: { region: 'Pujehun District, Southern Province', latitude: 7.55, longitude: -11.35 },
  hours: { open: '08:00', close: '17:00', daysOpen: 'Daily' },
  rating: 4.6,
  reviewCount: 18,
  images: ['/img/tiwai.jpg'],
  tags: ['wildlife', 'island'],
  sources: ['https://example.org/tiwai'],
  faqs: [
    {
      question: 'How do you get to Tiwai Island?',
      answer: 'Tiwai Island is reached by road to a Moa River landing, then by boat.',
    },
  ],
};

describe('touristAttraction JSON-LD', () => {
  it('declares a SpeakableSpecification over the lead and facts', () => {
    const node = touristAttraction(sample);
    expect(node.speakable).toEqual({
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-speakable="lead"]', '[data-speakable="facts"]'],
    });
  });

  it('exposes aggregateRating when the attraction has reviews', () => {
    const node = touristAttraction(sample) as Record<string, Record<string, unknown>>;
    expect(node.aggregateRating).toMatchObject({
      '@type': 'AggregateRating',
      ratingValue: 4.6,
      reviewCount: 18,
    });
  });

  it('omits aggregateRating when there are no reviews', () => {
    const node = touristAttraction({ ...sample, reviewCount: 0 });
    expect(node.aggregateRating).toBeUndefined();
  });
});

describe('attractionGraph FAQ', () => {
  it('emits a self-contained FAQPage Question/Answer for each faq', () => {
    const graph = attractionGraph(sample) as { '@graph': Record<string, unknown>[] };
    const faq = graph['@graph'].find((n) => n['@type'] === 'FAQPage') as {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(faq.mainEntity).toHaveLength(1);
    expect(faq.mainEntity[0].name).toMatch(/\?$/);
    // Self-contained: the answer does not defer with "see above"/"as mentioned".
    expect(faq.mainEntity[0].acceptedAnswer.text).not.toMatch(/see above|as mentioned/i);
    expect(faq.mainEntity[0].acceptedAnswer.text.length).toBeGreaterThan(20);
  });
});
