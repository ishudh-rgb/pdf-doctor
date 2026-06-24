let initialized = false;

export async function initSentry() {
  if (initialized) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    enabled: process.env.NODE_ENV === "production",
  });
  initialized = true;
}

export async function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!process.env.SENTRY_DSN) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    if (context) {
      Sentry.withScope((scope) => {
        scope.setContext("extra", context);
        Sentry.captureException(error);
      });
      return;
    }
    Sentry.captureException(error);
  } catch {
    /* optional */
  }
}
