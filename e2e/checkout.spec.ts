import { test, expect } from "@playwright/test";

test.describe("Checkout API", () => {
  test("create-order requires authentication", async ({ request }) => {
    const res = await request.post("/api/payments/create-order", {
      data: { plan: "pro", duration: "monthly" },
    });
    expect(res.status()).toBe(401);
  });

  test("account delete requires password body", async ({ request }) => {
    const res = await request.delete("/api/user/account");
    expect([401, 403]).toContain(res.status());
  });
});
