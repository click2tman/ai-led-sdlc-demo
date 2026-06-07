// Schedule-a-Tour dialog (SPEC §9.4, §19 P6; confirm step issue #41, toast
// issue #40). Opens from the detail page; collects tour date, party size
// (1-20), and notes, then shows a confirmation step (schedule.confirm.*)
// before inserting a tour_bookings row via the repository. Success is a toast
// (schedule.success); errors stay inline. Uses the native <dialog> for a focus
// trap, Escape-to-close, and return focus. Guests route to /signin. Inputs are
// controlled so values survive the form<->confirm toggle. All copy via t().
import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { tourBookings } from '@/lib/account';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useToast } from '@/lib/toast/ToastProvider';
import { t, type StringKey } from '@/lib/content';
import { Button } from './Button';

const MIN_PARTY = 1;
const MAX_PARTY = 20;
const MAX_NOTES = 500;

/**
 * Today's date as YYYY-MM-DD in the user's LOCAL timezone, for the date
 * input's min and the past-date check. toISOString() would use UTC, which
 * shifts the day near midnight in non-UTC zones and could reject a valid
 * local "today" or accept "yesterday".
 */
function todayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** A validated booking awaiting the user's confirmation. */
type Pending = { date: string; partySize: number; notes: string };

export function ScheduleTourModal({ attractionId }: { attractionId: string }) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { show } = useToast();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [date, setDate] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);
  const [errorKey, setErrorKey] = useState<StringKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleOpen() {
    // user is transiently null during the initial session lookup; don't send
    // an already-signed-in user to /signin if they click quickly after load.
    if (loading) return;
    if (!user) {
      navigate('/signin');
      return;
    }
    setDate('');
    setPartySize('2');
    setNotes('');
    setPending(null);
    setErrorKey(null);
    dialogRef.current?.showModal();
  }

  function validate(value: Pending): StringKey | null {
    if (!value.date) return 'schedule.validation.dateRequired';
    if (value.date < todayIso()) return 'schedule.validation.datePast';
    if (
      !Number.isInteger(value.partySize) ||
      value.partySize < MIN_PARTY ||
      value.partySize > MAX_PARTY
    ) {
      return 'schedule.validation.partyRange';
    }
    if (value.notes.length > MAX_NOTES) return 'schedule.validation.notesLength';
    return null;
  }

  // Step 1: validate the form and move to the confirmation step.
  function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate: Pending = {
      date,
      partySize: Number(partySize),
      notes: notes.trim(),
    };
    const invalid = validate(candidate);
    if (invalid) {
      setErrorKey(invalid);
      return;
    }
    setErrorKey(null);
    setPending(candidate);
  }

  // Step 2: the user confirmed; create the booking and toast on success.
  async function handleConfirm() {
    if (!pending) return;
    setSubmitting(true);
    try {
      await tourBookings.create({
        attractionId,
        tourDate: pending.date,
        partySize: pending.partySize,
        notes: pending.notes === '' ? null : pending.notes,
      });
      dialogRef.current?.close();
      setPending(null);
      show(t('schedule.success'));
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

      <dialog
        ref={dialogRef}
        aria-labelledby="schedule-title"
        className="w-full max-w-md rounded-lg border border-border p-6 backdrop:bg-black/50"
      >
        {pending ? (
          // --- Confirmation step (issue #41) ---
          <div className="flex flex-col gap-4">
            <h2 id="schedule-title" className="text-xl font-bold">
              {t('schedule.confirm.title')}
            </h2>
            <p className="text-sm text-text-muted">
              {t('schedule.confirm.body')}
            </p>
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-text-muted">{t('schedule.field.date')}</dt>
              <dd>{pending.date}</dd>
              <dt className="text-text-muted">
                {t('schedule.field.partySize')}
              </dt>
              <dd>{pending.partySize}</dd>
            </dl>

            {errorKey && (
              <p role="alert" className="text-sm text-danger">
                {t(errorKey)}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                aria-busy={submitting}
              >
                {t('schedule.submit')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  setErrorKey(null);
                  setPending(null);
                }}
              >
                {t('schedule.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          // --- Form step ---
          <>
            <h2 id="schedule-title" className="text-xl font-bold">
              {t('schedule.modal.title')}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {t('schedule.modal.description')}
            </p>

            <form onSubmit={handleReview} noValidate className="mt-4 flex flex-col gap-4">
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
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
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
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
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
                  maxLength={MAX_NOTES}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                <Button type="submit">{t('schedule.submit')}</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => dialogRef.current?.close()}
                >
                  {t('schedule.cancel')}
                </Button>
              </div>
            </form>
          </>
        )}
      </dialog>
    </>
  );
}
