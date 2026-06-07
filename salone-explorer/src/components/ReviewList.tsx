// Live review list for the detail page (SPEC §9.3, §19 P9, ADR 0004 D3/D4).
// Client-only: loads published reviews + the caller's own review, subscribes
// to Supabase Realtime, and re-fetches on any change. Renders the auth-gated
// ReviewForm above the list. SSG-safe - the network work runs only in an
// effect, and the component degrades to a heading + empty state when Supabase
// is unconfigured (the crawlable aggregateRating/Review lives in the
// prerendered JSON-LD instead). Reviews are pseudonymous (no author PII).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { reviews, type Review } from '@/lib/account';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthProvider';
import { t, type StringKey } from '@/lib/content';
import { ReviewForm, type ReviewSavedAction } from './ReviewForm';

/** Success microcopy for each completed write (announced via role=status). */
const SUCCESS_KEY: Record<ReviewSavedAction, StringKey> = {
  created: 'reviews.success.created',
  updated: 'reviews.success.updated',
  deleted: 'reviews.success.deleted',
};

/** Localised date for display (data formatting, not content copy). */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Read-only 1-5 star display with an accessible label. */
function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${rating} ${t('reviews.ratingOutOf')}`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={
            value <= rating ? 'h-4 w-4 fill-warning text-warning' : 'h-4 w-4 text-border'
          }
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export function ReviewList({ attractionId }: { attractionId: string }) {
  const { user } = useAuth();
  const [published, setPublished] = useState<Review[]>([]);
  const [own, setOwn] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [successKey, setSuccessKey] = useState<StringKey | null>(null);
  const configured = isSupabaseConfigured();
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    try {
      const [list, mine] = await Promise.all([
        reviews.listPublished(attractionId),
        user ? reviews.getOwn(attractionId) : Promise.resolve(null),
      ]);
      if (!mounted.current) return;
      setPublished(list);
      setOwn(mine);
      setError(false);
    } catch {
      if (mounted.current) setError(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [attractionId, user, configured]);

  const handleSaved = useCallback(
    (action: ReviewSavedAction) => {
      setSuccessKey(SUCCESS_KEY[action]);
      void load();
    },
    [load],
  );

  useEffect(() => {
    mounted.current = true;
    void load();
    // Live updates: any change to this attraction's reviews triggers a reload.
    const unsubscribe = reviews.subscribe(attractionId, () => void load());
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [attractionId, load]);

  return (
    <section aria-labelledby="reviews-heading" className="mt-12">
      <h2 id="reviews-heading" className="text-2xl font-bold">
        {t('reviews.heading')}
      </h2>
      <p className="mt-1 text-text-muted">{t('reviews.intro')}</p>

      <ReviewForm
        key={own?.id ?? 'new'}
        attractionId={attractionId}
        existing={own}
        onSaved={handleSaved}
      />

      {successKey && (
        <p role="status" className="mt-3 text-sm text-success">
          {t(successKey)}
        </p>
      )}

      {error ? (
        <p role="alert" className="mt-6 text-sm text-danger">
          {t('reviews.error.generic')}
        </p>
      ) : loading ? (
        <p role="status" className="mt-6 text-sm text-text-muted">
          {t('common.loading')}
        </p>
      ) : published.length === 0 ? (
        <p className="mt-6 text-sm text-text-muted">{t('reviews.empty')}</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {published.map((review) => (
            <li
              key={review.id}
              className="rounded-lg border border-border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars rating={review.rating} />
                <span className="text-xs text-text-muted">
                  {own && review.id === own.id
                    ? t('reviews.you')
                    : t('reviews.author.generic')}{' '}
                  · {formatDate(review.createdAt)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-text">
                {review.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
