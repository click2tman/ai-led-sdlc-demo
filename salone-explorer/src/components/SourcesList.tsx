// On-page source attributions (SPEC §4, §13.2). Lists the public sources an
// attraction's facts were paraphrased from. Outbound links open in a new tab
// with rel="noopener noreferrer".
import { t } from '@/lib/content';

type SourcesListProps = {
  sources: string[];
};

/** Render a bare hostname as the human-readable link text. */
function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function SourcesList({ sources }: SourcesListProps) {
  return (
    <section aria-labelledby="sources-heading" className="border-t border-border pt-6">
      <h2 id="sources-heading" className="text-lg font-semibold">
        {t('attraction.sources.heading')}
      </h2>
      <p className="mt-1 text-sm text-text-muted">{t('attraction.sources.intro')}</p>
      <ul className="mt-3 flex flex-col gap-1">
        {sources.map((url) => (
          <li key={url}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-accent underline underline-offset-2 hover:no-underline"
            >
              {hostnameOf(url)}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
