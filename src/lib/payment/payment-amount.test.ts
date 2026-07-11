import { describe, expect, it } from "vitest";
import {
  inrToPaise,
  paiseToInr,
  storedAmountInInr,
  storedPaymentAmountToPaise,
} from "@/lib/payment/payment-amount";
import { PRO_PRICING, TEAM_PRICING } from "@/config/constants";

describe("payment-amount", () => {
  it("converts INR and paise", () => {
    expect(inrToPaise(299)).toBe(29900);
    expect(paiseToInr(29900)).toBe(299);
  });

  it("normalizes INR-stored payment amounts", () => {
    expect(storedPaymentAmountToPaise(299)).toBe(29900);
    expect(storedPaymentAmountToPaise(PRO_PRICING.yearlyInr)).toBe(PRO_PRICING.yearlyPaise);
    expect(storedAmountInInr(PRO_PRICING.yearlyInr)).toBe(PRO_PRICING.yearlyInr);
    expect(storedPaymentAmountToPaise(Number.NaN)).toBe(0);
  });

  it("normalizes legacy paise-stored payment amounts", () => {
    expect(storedPaymentAmountToPaise(29900)).toBe(29900);
    expect(storedPaymentAmountToPaise(PRO_PRICING.yearlyPaise)).toBe(PRO_PRICING.yearlyPaise);
    expect(storedAmountInInr(29900)).toBe(299);
  });

  it("normalizes team plan INR amounts", () => {
    const teamMonthlyInr = TEAM_PRICING.monthlyInrPerSeat * TEAM_PRICING.defaultSeatLimit;
    expect(storedPaymentAmountToPaise(teamMonthlyInr)).toBe(inrToPaise(teamMonthlyInr));
    expect(storedAmountInInr(teamMonthlyInr)).toBe(teamMonthlyInr);
  });
});
