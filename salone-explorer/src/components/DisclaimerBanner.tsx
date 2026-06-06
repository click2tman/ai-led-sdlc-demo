// Home demo-disclaimer alert (SPEC §9.1, DS Alert). Dismissible; the
// dismissal persists in localStorage so it does not reappear every visit.
// This is one of the three mandatory disclaimer placements (§17).
import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { t } from '@/lib/content';

const STORAGE_KEY = 'salone-explorer:disclaimer-dismissed';

export function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(true);

  // Read persisted state after mount so prerendered HTML shows the banner
  // and only hides it for returning visitors who dismissed it.
  useEffect(() => {
    setDismissed(window.localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label={t('disclaimer.bannerLabel')}
      className="border-b border-warning/40 bg-brand-sand"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
        <p className="flex-1 text-sm text-text">{t('disclaimer.full')}</p>
        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-text-muted hover:text-text"
          aria-label={t('disclaimer.dismiss')}
          onClick={() => {
            window.localStorage.setItem(STORAGE_KEY, 'true');
            setDismissed(true);
          }}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
