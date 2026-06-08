// Moderation queue page (issue #50, ADR 0009). Role-gated: renders the queue
// only for moderators (reviewFlags.getRole()); others get a not-available
// message. Lists reported reviews with flag count + reasons and publish/flag/
// remove actions wired to setStatus - the moderator RLS policy + content-guard
// trigger allow ONLY the status change, never review content. noindex operator
// surface; not in the prerender list. All copy via the content layer.
import { useCallback, useEffect, useState } from 'react';
import {
  reviewFlags,
  type ModerationItem,
  type ReviewStatus,
  type FlagReason,
} from '@/lib/account';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useToast } from '@/lib/toast/ToastProvider';
import { t, type StringKey } from '@/lib/content';
import { SeoHead } from '@/seo/SeoHead';
import { Button } from '@/components/Button';

const ACTIONS: { status: ReviewStatus; key: 'publish' | 'flag' | 'remove' }[] = [
  { status: 'published', key: 'publish' },
  { status: 'flagged', key: 'flag' },
  { status: 'removed', key: 'remove' },
];

const STATUS_KEY: Record<ReviewStatus, StringKey> = {
  published: 'moderation.status.published',
  flagged: 'moderation.status.flagged',
  removed: 'moderation.status.removed',
};

function reasonLabels(reasons: FlagReason[]): string {
  return reasons.map((reason) => t(`reviews.flag.reason.${reason}` as StringKey)).join(', ');
}

export function ModeratePage() {
  const { user, loading: authLoading } = useAuth();
  const { show } = useToast();
  const [isModerator, setIsModerator] = useState(false);
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const role = await reviewFlags.getRole();
      if (role !== 'moderator') {
        setIsModerator(false);
        return;
      }
      setIsModerator(true);
      setItems(await reviewFlags.listQueue());
    } catch {
      // A real failure (not "not a moderator") gets its own message.
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsModerator(false);
      setLoading(false);
      return;
    }
    void load();
  }, [authLoading, user, load]);

  async function setStatus(reviewId: string, status: ReviewStatus) {
    if (busy) return;
    setBusy(true);
    try {
      await reviewFlags.setStatus(reviewId, status);
      show(t('moderation.success'));
      await load();
    } catch {
      show(t('moderation.error'));
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || loading) {
    return (
      <p role="status" className="mx-auto max-w-4xl px-4 py-16 text-text-muted">
        {t('common.loading')}
      </p>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <SeoHead
          title={`${t('moderation.title')} - ${t('app.name')}`}
          description={t('moderation.intro')}
          path="/moderate"
          noindex
        />
        <p role="alert" className="text-danger">
          {t('moderation.error')}
        </p>
      </section>
    );
  }

  if (!isModerator) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <SeoHead
          title={`${t('moderation.forbidden.title')} - ${t('app.name')}`}
          description={t('moderation.forbidden.body')}
          path="/moderate"
          noindex
        />
        <h1 className="text-3xl font-bold">{t('moderation.forbidden.title')}</h1>
        <p className="mt-3 text-text-muted">{t('moderation.forbidden.body')}</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <SeoHead
        title={`${t('moderation.title')} - ${t('app.name')}`}
        description={t('moderation.intro')}
        path="/moderate"
        noindex
      />
      <h1 className="text-3xl font-bold">{t('moderation.title')}</h1>
      <p className="mt-1 text-text-muted">{t('moderation.intro')}</p>

      {items.length === 0 ? (
        <p className="mt-6 text-text-muted">{t('moderation.empty')}</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.reviewId} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium">{item.attractionId}</span>
                <span className="text-text-muted">
                  {item.flagCount} {t('moderation.col.reports')} · {reasonLabels(item.reasons)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-text">{item.body}</p>
              <p className="mt-1 text-xs text-text-muted">
                {t('moderation.col.status')}: {t(STATUS_KEY[item.status])}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ACTIONS.map((action) => (
                  <Button
                    key={action.key}
                    type="button"
                    variant={item.status === action.status ? 'primary' : 'outline'}
                    disabled={busy || item.status === action.status}
                    onClick={() => setStatus(item.reviewId, action.status)}
                  >
                    {t(`moderation.action.${action.key}`)}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
