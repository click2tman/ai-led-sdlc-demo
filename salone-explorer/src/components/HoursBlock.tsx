// Opening-hours fact block for the detail page. Labels come from the content
// layer; values come from the attraction record. Marked data-speakable for
// AEO key-facts extraction (SPEC §13.3).
import { Clock } from 'lucide-react';
import type { AttractionHours } from '@/data/types';
import { t } from '@/lib/content';

type HoursBlockProps = {
  hours: AttractionHours;
};

export function HoursBlock({ hours }: HoursBlockProps) {
  // Only show a time row when there is a genuine range. Records that are
  // open-ended (e.g. a multi-day trek using 00:00-00:00) or have no times
  // rely on daysOpen + notes, mirroring the JSON-LD builder.
  const hasRange = Boolean(hours.open && hours.close && hours.open !== hours.close);
  return (
    <section
      aria-labelledby="hours-heading"
      className="rounded-lg border border-border bg-surface p-4"
      data-speakable="facts"
    >
      <h2
        id="hours-heading"
        className="mb-2 flex items-center gap-2 text-lg font-semibold"
      >
        <Clock className="h-5 w-5 text-brand-accent" aria-hidden="true" />
        {t('attraction.openingHours')}
      </h2>
      <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-text-muted">{t('attraction.openingHours.days')}</dt>
        <dd>{hours.daysOpen}</dd>
        {hasRange && (
          <>
            <dt className="text-text-muted">{t('attraction.openingHours.time')}</dt>
            <dd>
              {hours.open} - {hours.close}
            </dd>
          </>
        )}
      </dl>
      {hours.notes && (
        <p className="mt-2 text-sm text-warning">
          <span className="font-medium">{t('attraction.openingHours.notesLabel')}:</span>{' '}
          {hours.notes}
        </p>
      )}
    </section>
  );
}
