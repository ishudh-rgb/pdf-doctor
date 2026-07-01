import { getSentryInitOptions } from "@/lib/ops/sentry-config";

let initialized = false;

export async function initSentry() {
  if (initialized) return;
  const options = getSentryInitOptions();
  if (!options.dsn) return;

  const Sentry = await import("@sentry/nextjs");
  Sentry.init(options);
  initialized = true;
}

export async function captureException(error: unknown, context?: Record<string, unknown>) {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
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
