import type { ErrorEvent, EventHint } from "@sentry/nextjs";

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "x-health-key",
  "x-api-key",
  "x-cron-secret",
]);

function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request?.headers) {
    for (const key of Object.keys(event.request.headers)) {
      if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
        delete event.request.headers[key];
      }
    }
  }

  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
  }

  if (event.extra) {
    delete event.extra.password;
    delete event.extra.razorpay_signature;
    delete event.extra.stack_trace;
  }

  return event;
}

/** Shared Sentry init options for server, client, and instrumentation. */
export function getSentryInitOptions() {
  return {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
    enabled: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
    beforeSend(event: ErrorEvent, _hint: EventHint) {
      return scrubEvent(event);
    },
  };
}
