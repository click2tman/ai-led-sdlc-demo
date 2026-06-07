// Auth-gated review form (SPEC §9.3, §19 P9, ADR 0004). Lets a signed-in user
// create, edit, or delete their own review for an attraction (one per
// attraction, enforced by the DB unique constraint). Rating is an accessible
// radio group; body is bounded to 2000 chars. All copy via the content layer;
// the duplicate-key error maps to reviews.error.duplicate. Guests see a
// sign-in gate. Renders nothing until the auth session resolves.
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { reviews, type Review } from '@/lib/account';
import { useAuth } from '@/lib/auth/AuthProvider';
import { t, type StringKey } from '@/lib/content';
import { Button } from './Button';

const MAX_BODY = 2000;
const RATINGS = [1, 2, 3, 4, 5] as const;

/** Which write the form just completed, so the parent can announce success. */
export type ReviewSavedAction = 'created' | 'updated' | 'deleted';

/** Postgres unique-violation code for the one-review-per-attraction guard. */
function isDuplicate(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === '23505'
  );
}

export function ReviewForm({
  attractionId,
  existing,
  onSaved,
}: {
  attractionId: string;
  existing: Review | null;
  onSaved: (action: ReviewSavedAction) => void;
}) {
  const { user, configured, loading } = useAuth();
  const [rating, setRating] = useState<number>(existing?.rating ?? 0);
  const [errorKey, setErrorKey] = useState<StringKey | null>(null);
  const [busy, setBusy] = useState(false);
  const isEdit = existing !== null;

  // Session still resolving or auth unavailable: render nothing rather than
  // flashing a sign-in gate to a user who is actually signed in.
  if (loading || !configured) return null;

  if (!user) {
    return (
      <p className="mt-4 text-sm text-text-muted">
        <Link to="/signin" className="text-brand-accent hover:underline">
          {t('reviews.signInToReview')}
        </Link>
      </p>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorKey(null);
    const body = String(
      new FormData(event.currentTarget).get('body') ?? '',
    ).trim();

    if (rating < 1 || rating > 5) {
      setErrorKey('reviews.validation.rating');
      return;
    }
    if (body.length === 0) {
      setErrorKey('reviews.validation.bodyRequired');
      return;
    }
    if (body.length > MAX_BODY) {
      setErrorKey('reviews.validation.bodyLength');
      return;
    }

    setBusy(true);
    try {
      if (isEdit) {
        await reviews.updateOwn(existing.id, { rating, body });
        onSaved('updated');
      } else {
        await reviews.create({ attractionId, rating, body });
        onSaved('created');
      }
    } catch (error) {
      setErrorKey(isDuplicate(error) ? 'reviews.error.duplicate' : 'reviews.error.generic');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    setErrorKey(null);
    setBusy(true);
    try {
      await reviews.deleteOwn(existing.id);
      setRating(0);
      onSaved('deleted');
    } catch {
      setErrorKey('reviews.error.generic');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
      <h3 className="text-base font-semibold">
        {t(isEdit ? 'reviews.form.editHeading' : 'reviews.form.writeHeading')}
      </h3>
      {isEdit && (
        <p className="text-sm text-text-muted">{t('reviews.alreadyReviewed')}</p>
      )}

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">
          {t('reviews.form.ratingLabel')}
        </legend>
        <div className="flex gap-2" role="radiogroup" aria-describedby="rating-hint">
          {RATINGS.map((value) => (
            <label
              key={value}
              className={`inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-md border px-3 ${
                rating === value
                  ? 'border-brand-primary bg-brand-primary text-white'
                  : 'border-border text-text hover:bg-surface'
              }`}
            >
              <input
                type="radio"
                name="rating"
                value={value}
                checked={rating === value}
                onChange={() => setRating(value)}
                aria-label={`${value} ${t('reviews.ratingOutOf')}`}
                className="sr-only"
              />
              {value}
            </label>
          ))}
        </div>
        <p id="rating-hint" className="text-xs text-text-muted">
          {t('reviews.form.ratingHint')}
        </p>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="review-body" className="text-sm font-medium">
          {t('reviews.form.bodyLabel')}
        </label>
        <textarea
          id="review-body"
          name="body"
          rows={4}
          required
          maxLength={MAX_BODY}
          defaultValue={existing?.body ?? ''}
          placeholder={t('reviews.form.bodyPlaceholder')}
          className="rounded-md border border-border px-3 py-2"
        />
      </div>

      {errorKey && (
        <p role="alert" className="text-sm text-danger">
          {t(errorKey)}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy} aria-busy={busy}>
          {t(isEdit ? 'reviews.form.update' : 'reviews.form.submit')}
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={handleDelete}
          >
            {t('reviews.form.delete')}
          </Button>
        )}
      </div>
    </form>
  );
}
