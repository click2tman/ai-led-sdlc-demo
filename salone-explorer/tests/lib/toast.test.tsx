// Unit tests for the Toast provider (SPEC §9.4, issue #40). A shown toast
// appears in the live region and auto-dismisses; useToast outside a provider
// fails fast.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '@/lib/toast/ToastProvider';

function Trigger({ message }: { message: string }) {
  const { show } = useToast();
  return (
    <button type="button" onClick={() => show(message)}>
      fire
    </button>
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe('ToastProvider', () => {
  it('shows a toast on show() and auto-dismisses it', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger message="Your review was posted." />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText('fire'));
    expect(screen.getByText('Your review was posted.')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByText('Your review was posted.')).toBeNull();
  });

  it('useToast throws when used outside a provider', () => {
    const render_ = () => render(<Trigger message="x" />);
    expect(render_).toThrow(/within <ToastProvider>/);
  });
});
