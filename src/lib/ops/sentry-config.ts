import type { ErrorEvent } from "@sentry/nextjs";
import { redactSensitiveText } from "@/lib/server/safe-log";

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "x-health-key",
  "x-api-key",
  "x-cron-secret",
]);

const SENSITIVE_EXTRA_KEYS = new Set([
  "password",
  "email",
  "user_id",
  "admin_email",
  "razorpay_signature",
  "stack_trace",
  "token",
  "access_token",
  "refresh_token",
  "api_key",
  "authorization",
  "replyTo",
  "message",
  "full_name",
  "phone",
  "contact",
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
    delete event.user.username;
  }

  if (event.extra) {
    for (const key of Object.keys(event.extra)) {
      if (SENSITIVE_EXTRA_KEYS.has(key.toLowerCase())) {
        delete event.extra[key];
      }
    }
  }

  if (typeof event.message === "string") {
    event.message = redactSensitiveText(event.message);
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
    beforeSend(event: ErrorEvent) {
      return scrubEvent(event);
    },
  };
}
