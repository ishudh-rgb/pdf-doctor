import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.integration.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      include: ["src/lib/**/*.ts", "src/app/api/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.integration.test.ts",
        "src/lib/**/*.types.ts",
        "src/test/**",
        // Conversion pipeline — out of audit/test scope; not modified by product fixes.
        "src/lib/services/pdf-*.ts",
        "src/lib/services/*-to-pdf.service.ts",
        "src/lib/services/*-pdf.service.ts",
        "src/lib/services/pptx-parse.service.ts",
        "src/lib/services/legacy-ppt-parse.service.ts",
        "src/lib/services/summary-export.service.ts",
        "src/lib/services/libreoffice-core.service.ts",
        "src/lib/pdf/**",
        "src/lib/edit-pdf/**",
        "src/lib/ai/**",
        "src/lib/api/tool-route.ts",
        "src/app/api/tools/**",
        "src/lib/db/queries.ts",
        "src/lib/payment/pro-checkout.client.ts",
      ],
      thresholds: {
        // Coverage measured on business logic + API routes (conversion pipeline excluded).
        lines: 32,
        functions: 38,
        branches: 50,
        statements: 32,
        "src/lib/services/pdf-merge.service.ts": {
          lines: 60,
          functions: 100,
        },
        "src/lib/services/pdf-split.service.ts": {
          lines: 50,
          functions: 100,
        },
        "src/lib/services/pdf-compress.service.ts": {
          lines: 60,
          functions: 100,
        },
        "src/lib/server/auth-guard-http.ts": {
          lines: 100,
          functions: 100,
        },
        "src/lib/server/user-blocked-http.ts": {
          lines: 100,
          functions: 100,
        },
        "src/lib/payment/payment-amount.ts": {
          lines: 100,
          functions: 100,
        },
        "src/lib/privacy/gdpr-export.ts": {
          lines: 100,
          functions: 100,
        },
        "src/lib/security/csp.ts": {
          lines: 100,
          functions: 100,
        },
        "src/lib/enterprise/org-plan-policy.ts": {
          lines: 100,
          functions: 100,
        },
        "src/lib/privacy/retention.ts": {
          lines: 100,
          functions: 100,
        },
        "src/lib/auth/mfa-assurance.ts": {
          lines: 85,
          functions: 100,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
