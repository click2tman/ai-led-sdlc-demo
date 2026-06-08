// Live review list for the detail page (SPEC §9.3, §19 P9, ADR 0004 D3/D4).
// Client-only: loads published reviews + the caller's own review, subscribes
// to Supabase Realtime, and re-fetches on any change. Renders the auth-gated
// ReviewForm above the list. SSG-safe - the network work runs only in an
// effect, and the component degrades to a heading + empty state when Supabase
// is unconfigured (the crawlable aggregateRating/Review lives in the
// prerendered JSON-LD instead). Reviews are pseudonymous (no author PII).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { reviews, reviewFlags, type Review, type FlagReason } from '@/lib/account';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useToast } from '@/lib/toast/ToastProvider';
import { t, type StringKey } from '@/lib/content';
import { ReviewForm, type ReviewSavedAction } from './ReviewForm';
import { Button } from './Button';

const FLAG_REASONS: FlagReason[] = ['spam', 'offensive', 'inaccurate', 'other'];

/** Report affordance for another user's review (issue #50). A signed-in,
 * non-author reader picks a reason; flagging is idempotent (one per user). */
function FlagButton({ reviewId }: { reviewId: string }) {
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<FlagReason>('spam');
  const [flagged, setFlagged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reflect a prior-session flag so returning users see "Reported", not the
  // CTA. A failed pre-check is non-critical: it just leaves the CTA shown (the
  // flag action itself is idempotent and surfaces its own errors).
  useEffect(() => {
    let active = true;
    reviewFlags
      .hasFlagged(reviewId)
      .then((already) => {
        if (active && already) setFlagged(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [reviewId]);

  if (flagged) {
    return <span className="text-xs text-text-muted">{t('reviews.flag.already')}</span>;
  }

  async function submit() {
    setSubmitting(true);
    try {
      await reviewFlags.flag({ reviewId, reason });
      setFlagged(true);
      setOpen(false);
      show(t('reviews.flag.success'));
    } catch {
      show(t('reviews.flag.error'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="text-xs text-text-muted underline hover:no-underline"
      >
        {t('reviews.flag.cta')}
      </button>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded border border-border p-2">
      <fieldset className="flex flex-col gap-1">
        <legend className="text-xs font-medium">{t('reviews.flag.reasonLabel')}</legend>
        {FLAG_REASONS.map((value) => (
          <label key={value} className="flex items-center gap-1.5 text-xs">
            <input
              type="radio"
              name={`flag-${reviewId}`}
              value={value}
              checked={reason === value}
              onChange={() => setReason(value)}
            />
            {t(`reviews.flag.reason.${value}` as StringKey)}
          </label>
        ))}
      </fieldset>
      <div className="flex gap-2">
        <Button type="button" onClick={submit} disabled={submitting} aria-busy={submitting}>
          {t('reviews.flag.submit')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={submitting}
        >
          {t('reviews.flag.cancel')}
        </Button>
      </div>
    </div>
  );
}

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
  const { show } = useToast();
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
      show(t(SUCCESS_KEY[action]));
      void load();
    },
    [load, show],
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
              {user && !(own && review.id === own.id) && (
                <div className="mt-2">
                  <FlagButton reviewId={review.id} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
