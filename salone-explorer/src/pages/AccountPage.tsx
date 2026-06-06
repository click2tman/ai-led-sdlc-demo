// My Account page (SPEC §9.5, §19 P6). Protected (ProtectedRoute): profile
// (email, member-since, sign-out), bookmarks and favorites grids with remove,
// and scheduled tours with cancel. Each section has an empty state from
// account.*.empty. Data loads client-side through the RLS-scoped repositories;
// saved/booking rows are joined to attraction names via the attractions repo.
// noindex - private page. All copy via the content layer.
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { attractions } from '@/lib/content';
import {
  savedAttractions,
  tourBookings,
  type BookingStatus,
  type SavedAttraction,
  type SavedKind,
  type TourBooking,
} from '@/lib/account';
import type { Attraction } from '@/data/types';
import { useAuth } from '@/lib/auth/AuthProvider';
import { t, type StringKey } from '@/lib/content';
import { SeoHead } from '@/seo/SeoHead';
import { Button } from '@/components/Button';

/** Map a booking status to its content key so no enum value reaches the UI. */
const STATUS_KEY: Record<BookingStatus, StringKey> = {
  pending: 'account.tours.status.pending',
  confirmed: 'account.tours.status.confirmed',
  cancelled: 'account.tours.status.cancelled',
};

/** Format an ISO timestamp as a localised date for display (not content). */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function AccountPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [byId, setById] = useState<Map<string, Attraction>>(new Map());
  const [bookmarks, setBookmarks] = useState<SavedAttraction[]>([]);
  const [favorites, setFavorites] = useState<SavedAttraction[]>([]);
  const [tours, setTours] = useState<TourBooking[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [all, bookmarkRows, favoriteRows, tourRows] = await Promise.all([
        attractions.getAll(),
        savedAttractions.listByKind('bookmark'),
        savedAttractions.listByKind('favorite'),
        tourBookings.list(),
      ]);
      setById(new Map(all.map((a) => [a.id, a])));
      setBookmarks(bookmarkRows);
      setFavorites(favoriteRows);
      setTours(tourRows);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSignOut() {
    // The SDK clears the local session even if the remote call fails, so
    // always navigate home; never strand the user on a protected page.
    try {
      await signOut();
    } finally {
      navigate('/');
    }
  }

  async function handleRemoveSaved(attractionId: string, kind: SavedKind) {
    setActionError(false);
    try {
      await savedAttractions.remove(attractionId, kind);
      const setter = kind === 'bookmark' ? setBookmarks : setFavorites;
      setter((rows) => rows.filter((r) => r.attractionId !== attractionId));
    } catch {
      // Surface the failure and re-sync from the server so the list never
      // shows a row as removed when the delete did not land.
      setActionError(true);
      void load();
    }
  }

  async function handleCancelTour(id: string) {
    setActionError(false);
    try {
      await tourBookings.cancel(id);
      setTours((rows) =>
        rows.map((row) =>
          row.id === id ? { ...row, status: 'cancelled' } : row,
        ),
      );
    } catch {
      setActionError(true);
      void load();
    }
  }

  return (
    <>
      <SeoHead
        title={`${t('account.title')} - ${t('app.name')}`}
        description={t('account.profile.heading')}
        path="/account"
        noindex
      />
      <section className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-bold">{t('account.title')}</h1>

        <section aria-labelledby="profile-heading" className="mt-8">
          <h2 id="profile-heading" className="text-xl font-semibold">
            {t('account.profile.heading')}
          </h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex gap-2">
              <dt className="font-medium">{t('account.profile.email')}</dt>
              <dd>{user?.email}</dd>
            </div>
            {user?.created_at && (
              <div className="flex gap-2">
                <dt className="font-medium">
                  {t('account.profile.memberSince')}
                </dt>
                <dd>{formatDate(user.created_at)}</dd>
              </div>
            )}
          </dl>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={handleSignOut}
          >
            {t('account.profile.signout')}
          </Button>
        </section>

        {actionError && (
          <p role="alert" className="mt-8 text-sm text-danger">
            {t('errors.generic')}
          </p>
        )}

        {error ? (
          <p role="alert" className="mt-8 text-sm text-danger">
            {t('errors.generic')}
          </p>
        ) : loading ? (
          <p role="status" className="mt-8 text-sm text-text-muted">
            {t('common.loading')}
          </p>
        ) : (
          <>
            <SavedSection
              headingId="bookmarks-heading"
              heading={t('account.bookmarks.heading')}
              empty={t('account.bookmarks.empty')}
              rows={bookmarks}
              byId={byId}
              onRemove={(id) => handleRemoveSaved(id, 'bookmark')}
            />
            <SavedSection
              headingId="favorites-heading"
              heading={t('account.favorites.heading')}
              empty={t('account.favorites.empty')}
              rows={favorites}
              byId={byId}
              onRemove={(id) => handleRemoveSaved(id, 'favorite')}
            />
            <ToursSection
              tours={tours}
              byId={byId}
              onCancel={handleCancelTour}
            />
          </>
        )}
      </section>
    </>
  );
}

/** A bookmarks or favorites grid with per-item remove (SPEC §9.5). */
function SavedSection({
  headingId,
  heading,
  empty,
  rows,
  byId,
  onRemove,
}: {
  headingId: string;
  heading: string;
  empty: string;
  rows: SavedAttraction[];
  byId: Map<string, Attraction>;
  onRemove: (attractionId: string) => void | Promise<void>;
}) {
  return (
    <section aria-labelledby={headingId} className="mt-10">
      <h2 id={headingId} className="text-xl font-semibold">
        {heading}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {rows.map((row) => {
            const attraction = byId.get(row.attractionId);
            return (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
              >
                <Link
                  to={`/attractions/${row.attractionId}`}
                  className="font-medium text-brand-accent hover:underline"
                >
                  {attraction?.name ?? row.attractionId}
                </Link>
                <button
                  type="button"
                  onClick={() => void onRemove(row.attractionId)}
                  className="inline-flex min-h-[44px] items-center px-3 text-sm text-text-muted hover:text-danger"
                >
                  {t('account.remove')}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** The scheduled-tours list with cancel (SPEC §9.5). */
function ToursSection({
  tours,
  byId,
  onCancel,
}: {
  tours: TourBooking[];
  byId: Map<string, Attraction>;
  onCancel: (id: string) => void | Promise<void>;
}) {
  return (
    <section aria-labelledby="tours-heading" className="mt-10">
      <h2 id="tours-heading" className="text-xl font-semibold">
        {t('account.tours.heading')}
      </h2>
      {tours.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">
          {t('account.tours.empty')}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {tours.map((tour) => {
            const attraction = byId.get(tour.attractionId);
            const cancelled = tour.status === 'cancelled';
            return (
              <li
                key={tour.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
              >
                <div className="text-sm">
                  <Link
                    to={`/attractions/${tour.attractionId}`}
                    className="font-medium text-brand-accent hover:underline"
                  >
                    {attraction?.name ?? tour.attractionId}
                  </Link>
                  <p className="text-text-muted">
                    {t('account.tours.date')}: {tour.tourDate} ·{' '}
                    {t('account.tours.party')}: {tour.partySize} ·{' '}
                    {t('account.tours.status')}: {t(STATUS_KEY[tour.status])}
                  </p>
                </div>
                {!cancelled && (
                  <button
                    type="button"
                    onClick={() => void onCancel(tour.id)}
                    className="inline-flex min-h-[44px] items-center px-3 text-sm text-text-muted hover:text-danger"
                  >
                    {t('account.tours.cancel')}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
