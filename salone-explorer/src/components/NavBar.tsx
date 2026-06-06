// Site header (SPEC §9.1, DS Header pattern). FambulTik logo linking home
// plus primary navigation. The mobile menu is a disclosure with a labelled
// toggle (aria-expanded / aria-controls) for keyboard and screen-reader use.
// Identical on every route (WCAG 3.2.3 consistent navigation). Phase 6: the
// trailing item is auth-aware - Account + Sign out when signed in, Sign in
// otherwise. Until the session resolves it shows the signed-out item, which
// matches the prerendered (signed-out) HTML so hydration stays stable.
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { FambulTikLogo } from './FambulTikLogo';
import { useAuth } from '@/lib/auth/AuthProvider';
import { t, type StringKey } from '@/lib/content';

type NavItem = { to: string; label: StringKey };

const BASE_ITEMS: NavItem[] = [
  { to: '/', label: 'nav.home' },
  { to: '/about', label: 'nav.about' },
];

function navLinkClass({ isActive }: { isActive: boolean }): string {
  const base =
    'inline-flex min-h-[44px] items-center px-3 text-base font-medium hover:text-brand-primary';
  return isActive ? `${base} text-brand-primary` : `${base} text-text`;
}

export function NavBar() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems: NavItem[] = user
    ? [...BASE_ITEMS, { to: '/account', label: 'nav.account' }]
    : [...BASE_ITEMS, { to: '/signin', label: 'nav.signin' }];

  async function handleSignOut() {
    setOpen(false);
    // The SDK clears the local session even on a failed remote call; always
    // navigate home rather than leave a half-signed-out header. Swallow the
    // error explicitly so it cannot surface as an unhandled rejection.
    try {
      await signOut();
    } catch {
      // Intentional: local session is already cleared; nothing to recover.
    } finally {
      navigate('/');
    }
  }

  /** Primary links plus the auth control, shared by desktop and mobile. */
  function renderItems() {
    return (
      <>
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={navLinkClass}
              end={item.to === '/'}
              onClick={() => setOpen(false)}
            >
              {t(item.label)}
            </NavLink>
          </li>
        ))}
        {user && (
          <li>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-[44px] items-center px-3 text-base font-medium text-text hover:text-brand-primary"
            >
              {t('nav.signout')}
            </button>
          </li>
        )}
      </>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <Link to="/" className="inline-flex items-center py-1" aria-label={t('nav.home')}>
          <FambulTikLogo height={44} />
        </Link>

        <nav aria-label={t('nav.primaryLabel')} className="hidden md:block">
          <ul className="flex items-center gap-1">{renderItems()}</ul>
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
            {renderItems()}
          </ul>
        </nav>
      )}
    </header>
  );
}
