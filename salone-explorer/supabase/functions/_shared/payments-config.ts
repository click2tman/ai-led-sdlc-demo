// Deposit pricing config (ADR 0008 D3). Server-side only: the amount is
// computed by create-checkout and NEVER accepted from the client (anti-tamper).
// Amounts are config/data, not content-layer copy, so they live here and not in
// strings.en.json. Pure - covered by vitest via test imports.
export const DEPOSIT_AMOUNT_CENTS = 2000; // fixed $20 tour deposit (ADR 0008)
export const DEPOSIT_CURRENCY = 'usd';
// Shown on the Stripe Checkout line item + receipt (config, not user-facing
// app copy; the function tree is outside the content layer).
export const DEPOSIT_PRODUCT_NAME = 'Salone Explorer tour deposit';
