// Site footer (SPEC §9.1, DS Footer pattern). Renders the full §17
// disclaimer (one of its three mandatory placements), the TpGroup
// endorsement line, a persistent help/contact link (WCAG 3.2.6), and the
// Built-with-Claude-Code credit. Identical on every route.
import { Link } from 'react-router-dom';
import { t } from '@/lib/content';

const FOOTER_NAV: { to: string; label: Parameters<typeof t>[0] }[] = [
  { to: '/', label: 'nav.home' },
  { to: '/about', label: 'nav.about' },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <section aria-labelledby="footer-nav-heading">
          <h2 id="footer-nav-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t('footer.nav.heading')}
          </h2>
          <ul className="flex flex-col gap-1">
            {FOOTER_NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-brand-accent hover:underline">
                  {t(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="footer-help-heading">
          <h2 id="footer-help-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t('footer.help.heading')}
          </h2>
          <ul className="flex flex-col gap-1">
            <li>
              <a
                href="https://www.tpgroupsl.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-accent hover:underline"
              >
                {t('footer.help.contact')}
              </a>
            </li>
          </ul>
        </section>

        <section aria-labelledby="footer-disclaimer-heading">
          <h2 id="footer-disclaimer-heading" className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t('footer.disclaimer.heading')}
          </h2>
          <p className="text-sm text-text-muted">{t('disclaimer.full')}</p>
        </section>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {year} {t('footer.copyright')}. {t('footer.tagline')}
          </p>
          <p>{t('footer.builtWith')}</p>
        </div>
      </div>
    </footer>
  );
}
