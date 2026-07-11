/** Payments table stores INR (decimal). Razorpay API uses paise. */

export function inrToPaise(inr: number): number {
  return Math.round(inr * 100);
}

export function paiseToInr(paise: number): number {
  return Math.round(paise) / 100;
}

/** Legacy rows saved amount as paise (e.g. 29900). Current rows store INR (e.g. 299). */
const LEGACY_PAISE_MIN = 10_000;

function isLegacyPaiseAmount(stored: number): boolean {
  return (
    Number.isInteger(stored) &&
    stored >= LEGACY_PAISE_MIN &&
    stored % 100 === 0
  );
}

/** Normalize stored payment amount to paise for Razorpay comparison. */
export function storedPaymentAmountToPaise(stored: number): number {
  const n = Number(stored);
  if (!Number.isFinite(n)) return 0;
  if (isLegacyPaiseAmount(n)) return Math.round(n);
  return inrToPaise(n);
}

/** Normalize stored payment amount to INR for admin reporting. */
export function storedAmountInInr(stored: number): number {
  const n = Number(stored);
  if (!Number.isFinite(n)) return 0;
  if (isLegacyPaiseAmount(n)) return paiseToInr(n);
  return n;
}
