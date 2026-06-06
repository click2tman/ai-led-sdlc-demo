// Site header (SPEC §9.1, DS Header pattern). FambulTik logo linking home
// plus primary navigation. The mobile menu is a disclosure with a labelled
// toggle (aria-expanded / aria-controls) for keyboard and screen-reader use.
// Identical on every route (WCAG 3.2.3 consistent navigation).
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { FambulTikLogo } from './FambulTikLogo';
import { t } from '@/lib/content';

type NavItem = { to: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'nav.home' },
  { to: '/about', label: 'nav.about' },
  { to: '/signin', label: 'nav.signin' },
];

function navLinkClass({ isActive }: { isActive: boolean }): string {
  const base =
    'inline-flex min-h-[44px] items-center px-3 text-base font-medium hover:text-brand-primary';
  return isActive ? `${base} text-brand-primary` : `${base} text-text`;
}

export function NavBar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <Link to="/" className="inline-flex items-center py-1" aria-label={t('nav.home')}>
          <FambulTikLogo variant="dark" height={32} />
        </Link>

        <nav aria-label={t('nav.primaryLabel')} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={navLinkClass} end={item.to === '/'}>
                  {t(item.label as Parameters<typeof t>[0])}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label={t('nav.primaryLabelMobile')}
          className="border-t border-border md:hidden"
        >
          <ul className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={navLinkClass}
                  end={item.to === '/'}
                  onClick={() => setOpen(false)}
                >
                  {t(item.label as Parameters<typeof t>[0])}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
