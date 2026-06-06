// FAQ accordion built on the Radix Accordion primitive (SPEC §8.5). Each
// answer is self-contained for AEO/FAQPage extraction (SPEC §13.3). Radix
// supplies keyboard support, aria-expanded, and focus management.
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { AttractionFaq } from '@/data/types';
import { t } from '@/lib/content';

type FaqAccordionProps = {
  faqs: AttractionFaq[];
};

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  return (
    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="mb-3 text-xl font-semibold">
        {t('attraction.faqs.heading')}
      </h2>
      <Accordion.Root type="single" collapsible className="flex flex-col gap-2">
        {faqs.map((faq, index) => {
          const value = `faq-${index}`;
          return (
            <Accordion.Item
              key={value}
              value={value}
              className="rounded-lg border border-border"
            >
              <Accordion.Header className="m-0">
                <Accordion.Trigger className="group flex min-h-[44px] w-full items-center justify-between gap-2 px-4 py-3 text-left text-base font-medium">
                  {faq.question}
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-brand-accent transition-transform group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="px-4 pb-4 text-text-muted">
                {faq.answer}
              </Accordion.Content>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
    </section>
  );
}
