import * as Sentry from "@sentry/nextjs";
import { getSentryInitOptions } from "./src/lib/ops/sentry-config";

Sentry.init(getSentryInitOptions());
