// Toast provider + useToast hook (SPEC §9.4, DS Toast; issue #40). A minimal
// accessible transient-notification surface: show(message) queues a toast
// that auto-dismisses, rendered in a polite live region so screen readers
// announce it without stealing focus. Used for success confirmations
// (schedule a tour, post/edit/remove a review). Errors stay inline near their
// control. SSG-safe: the container renders an empty live region during
// prerender; timers run only from client event handlers via show().
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ToastVariant = 'success' | 'error';
type Toast = { id: number; message: string; variant: ToastVariant };

type ToastContextValue = {
  /** Queue a transient toast (already-resolved copy; pass t(...) in). */
  show: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/** How long a toast stays before auto-dismissing. */
const TOAST_MS = 4000;

/**
 * Access the toast API. Throws outside <ToastProvider> so a miswired tree
 * fails fast rather than silently dropping notifications.
 */
export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (value === null) {
    throw new Error('useToast must be used within <ToastProvider>.');
  }
  return value;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, variant }]);
      // Browser-only: show() is called from event handlers, never render.
      setTimeout(() => dismiss(id), TOAST_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto max-w-md rounded-md px-4 py-2 text-sm text-white shadow-lg ${
              toast.variant === 'error' ? 'bg-danger' : 'bg-success'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
