// Email message composition (ADR 0007 D2/D3). Builds the subject + plain-text
// body for a booking event from the content-layer copy snapshot only - no
// hard-coded English here. Carries the minimum PII (attraction, date, party,
// status); never the notes field or user_id. Pure - unit-tested by vitest.
import { t, type EmailCopyKey } from './copy.ts';
import type { BookingEvent } from './types.ts';
import type { EmailMessage } from './email.ts';

/** The booking facts a message may include (ADR 0007 D3 - no notes/user_id). */
export type BookingDetails = {
  attractionName: string;
  tourDate: string;
  partySize: number;
};

/**
 * Compose the transactional email for a booking event. Subject + body come
 * entirely from email.* copy keys; details are interpolated as label: value
 * lines so strings stay HTML-free (the three-layer rule).
 */
export function composeEmail(
  event: BookingEvent,
  details: BookingDetails,
): Omit<EmailMessage, 'to'> {
  const subject = t(`email.${event}.subject` as EmailCopyKey);
  const lines = [
    t(`email.${event}.heading` as EmailCopyKey),
    '',
    t(`email.${event}.intro` as EmailCopyKey),
    '',
    t('email.details.heading'),
    `${t('email.details.attraction')}: ${details.attractionName}`,
    `${t('email.details.date')}: ${details.tourDate}`,
    `${t('email.details.party')}: ${details.partySize}`,
    '',
    t('email.signature'),
    t('email.disclaimer'),
  ];
  return { subject, text: lines.join('\n') };
}
