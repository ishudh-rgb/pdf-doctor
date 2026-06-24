export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProductionSecrets } = await import("@/lib/config/env-security");
    assertProductionSecrets();
    const { initSentry } = await import("@/lib/ops/sentry");
    await initSentry();
  }
}
