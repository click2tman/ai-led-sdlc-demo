// Schedule-a-Tour dialog (SPEC §9.4, §19 P6). Opens from the detail page;
// collects tour date, party size (1-20), and notes; inserts a tour_bookings
// row via the repository (RLS-scoped) and announces schedule.success. Uses
// the native <dialog> element for a focus trap, Escape-to-close, and return
// focus without a custom modal implementation. Guests are routed to /signin.
// All copy comes from the content layer; validation uses schedule.validation.*.
import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { tourBookings } from '@/lib/account';
import { useAuth } from '@/lib/auth/AuthProvider';
import { t, type StringKey } from '@/lib/content';
import { Button } from './Button';

const MIN_PARTY = 1;
const MAX_PARTY = 20;

/** Today's date as YYYY-MM-DD for the date input's min and past-date check. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ScheduleTourModal({ attractionId }: { attractionId: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [errorKey, setErrorKey] = useState<StringKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleOpen() {
    if (!user) {
      navigate('/signin');
      return;
    }
    setErrorKey(null);
    setSuccess(false);
    dialogRef.current?.showModal();
  }

  function validate(date: string, partySize: number): StringKey | null {
    if (!date) return 'schedule.validation.dateRequired';
    if (date < todayIso()) return 'schedule.validation.datePast';
    if (
      !Number.isInteger(partySize) ||
      partySize < MIN_PARTY ||
      partySize > MAX_PARTY
    ) {
      return 'schedule.validation.partyRange';
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorKey(null);
    const form = new FormData(event.currentTarget);
    const date = String(form.get('tourDate') ?? '');
    const partySize = Number(form.get('partySize'));
    const notes = String(form.get('notes') ?? '').trim();

    const invalid = validate(date, partySize);
    if (invalid) {
      setErrorKey(invalid);
      return;
    }

    setSubmitting(true);
    try {
      await tourBookings.create({
        attractionId,
        tourDate: date,
        partySize,
        notes: notes === '' ? null : notes,
      });
      dialogRef.current?.close();
      setSuccess(true);
    } catch {
      setErrorKey('errors.generic');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={handleOpen}>
        {t('schedule.cta')}
      </Button>

      {success && (
        <p role="status" className="mt-2 text-sm text-success">
          {t('schedule.success')}
        </p>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="schedule-title"
        className="w-full max-w-md rounded-lg border border-border p-6 backdrop:bg-black/50"
      >
        <h2 id="schedule-title" className="text-xl font-bold">
          {t('schedule.modal.title')}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {t('schedule.modal.description')}
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="tourDate" className="text-sm font-medium">
              {t('schedule.field.date')}
            </label>
            <input
              id="tourDate"
              name="tourDate"
              type="date"
              required
              min={todayIso()}
              className="min-h-[44px] rounded-md border border-border px-3"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="partySize" className="text-sm font-medium">
              {t('schedule.field.partySize')}
            </label>
            <input
              id="partySize"
              name="partySize"
              type="number"
              required
              min={MIN_PARTY}
              max={MAX_PARTY}
              defaultValue={2}
              aria-describedby="partySize-hint"
              className="min-h-[44px] rounded-md border border-border px-3"
            />
            <p id="partySize-hint" className="text-xs text-text-muted">
              {t('schedule.field.partySize.hint')}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="notes" className="text-sm font-medium">
              {t('schedule.field.notes')}{' '}
              <span className="text-text-muted">{t('common.optional')}</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder={t('schedule.field.notes.placeholder')}
              className="rounded-md border border-border px-3 py-2"
            />
          </div>

          {errorKey && (
            <p role="alert" className="text-sm text-danger">
              {t(errorKey)}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting} aria-busy={submitting}>
              {t('schedule.submit')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => dialogRef.current?.close()}
            >
              {t('schedule.cancel')}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
