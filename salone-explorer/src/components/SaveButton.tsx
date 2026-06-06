// Shared bookmark/favorite toggle (SPEC §9.3, §9.5). One accessible toggle
// button backing both BookmarkButton and FavoriteButton so the auth-gating,
// optimistic toggle, and live-region announcement live in one place. A guest
// is routed to /signin; a signed-in user toggles a saved_attractions row via
// the repository (RLS-scoped). aria-pressed reflects the saved state; status
// changes are announced in an sr-only live region. Copy is content-layer only.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { savedAttractions, type SavedKind } from '@/lib/account';
import { useAuth } from '@/lib/auth/AuthProvider';
import { t, type StringKey } from '@/lib/content';

export type SaveButtonLabels = {
  add: StringKey;
  remove: StringKey;
  added: StringKey;
  removed: StringKey;
};

type SaveButtonProps = {
  attractionId: string;
  kind: SavedKind;
  icon: LucideIcon;
  labels: SaveButtonLabels;
};

export function SaveButton({
  attractionId,
  kind,
  icon: Icon,
  labels,
}: SaveButtonProps) {
  const navigate = useNavigate();
  const { user, configured } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Hydrate the saved state for a signed-in user. Guests have nothing to load.
  useEffect(() => {
    if (!configured || !user) {
      setSaved(false);
      return;
    }
    let active = true;
    savedAttractions
      .isSaved(attractionId, kind)
      .then((result) => {
        if (active) setSaved(result);
      })
      .catch(() => {
        // A failed lookup leaves the control in the "not saved" state; the
        // toggle action will surface any real error loudly.
        if (active) setSaved(false);
      });
    return () => {
      active = false;
    };
  }, [attractionId, kind, user, configured]);

  async function handleClick() {
    if (!user) {
      navigate('/signin');
      return;
    }
    setBusy(true);
    try {
      if (saved) {
        await savedAttractions.remove(attractionId, kind);
        if (!mounted.current) return;
        setSaved(false);
        setAnnouncement(t(labels.removed));
      } else {
        await savedAttractions.add(attractionId, kind);
        if (!mounted.current) return;
        setSaved(true);
        setAnnouncement(t(labels.added));
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-pressed={saved}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border px-4 text-base font-medium text-text hover:bg-surface disabled:opacity-60"
      >
        <Icon className="h-5 w-5" aria-hidden={true} />
        {saved ? t(labels.remove) : t(labels.add)}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
