// Email provider abstraction (ADR 0007 D5). A thin EmailProvider interface so
// the transactional provider is swappable; resendProvider is the first impl,
// using fetch (universal across Deno and Node) so it is testable by mocking
// fetch. The API key is passed in by the caller from an Edge Function secret -
// never imported or logged. Pure module (no Deno globals).

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export type SendResult = {
  id: string;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<SendResult>;
}

/**
 * Resend implementation (https://resend.com). Sends plain-text transactional
 * email via the REST API.
 * @param apiKey - the EMAIL_PROVIDER_API_KEY function secret
 * @param from - the verified sender, e.g. "Salone Explorer <noreply@example.com>"
 */
export function resendProvider(apiKey: string, from: string): EmailProvider {
  return {
    async send({ to, subject, text }: EmailMessage): Promise<SendResult> {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, text }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Resend send failed (${response.status}): ${detail}`);
      }
      const data = (await response.json()) as { id?: string };
      if (!data.id) {
        throw new Error('Resend response missing message id.');
      }
      return { id: data.id };
    },
  };
}
