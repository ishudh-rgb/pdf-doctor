# OnlyMyPDF — Testing Guide

Quality pillar: unit tests, PDF conversion integration tests, Playwright E2E, and CI coverage gates. **Conversion pipeline source code is not modified** — tests exercise existing services and routes.

## Test pyramid

| Layer | Command | Location |
|-------|---------|----------|
| Unit | `npm run test` | `src/**/*.test.ts` |
| Integration | `npm run test` | `src/**/*.integration.test.ts`, PDF service/API tests |
| E2E | `npm run test:e2e` | `e2e/*.spec.ts` |
| Coverage | `npm run test:coverage` | Vitest v8 — enforced in CI |

## Unit & integration tests (Vitest)

```bash
npm run test              # all Vitest tests
npm run test:watch        # watch mode
npm run test:coverage     # with thresholds (see vitest.config.ts)
```

### PDF conversion integration

Real PDF bytes are generated with **pdf-lib** in `src/test/pdf-fixtures.ts` — no checked-in binaries.

| File | What it verifies |
|------|------------------|
| `src/lib/services/pdf-conversion.integration.test.ts` | merge, split, rotate, compress services |
| `src/lib/pdf/pdf-browser.test.ts` | client-side merge/split/rotate helpers |
| `src/app/api/tools/merge-pdf/route.integration.test.ts` | merge/split API validation + happy path |

Mocks isolate Supabase/logging (`logError`, `logToolUsage`) and route guards so tests run offline.

## E2E tests (Playwright)

```bash
npm run test:e2e:install   # first time: Chromium
npm run test:e2e
```

Requires a running app (Playwright starts `npm run dev` locally or standalone `node server.js` when `GITHUB_ACTIONS=true` after `npm run build`).

| Spec | Coverage |
|------|----------|
| `e2e/smoke.spec.ts` | health, home, robots, sitemap |
| `e2e/tools.spec.ts` | tool page UI smoke |
| `e2e/conversion.spec.ts` | **real PDF upload** — merge export + split workspace |
| `e2e/a11y.spec.ts` | axe smoke + marketing/tool color-contrast gates |
| `e2e/cwv.spec.ts`, `e2e/perf-budget.spec.ts` | Core Web Vitals + load/transfer budgets (replaces Lighthouse CI) |
| `e2e/legal.spec.ts`, `pricing.spec.ts`, `checkout.spec.ts` | legal/pricing flows |

Local verification:

```bash
npm run test:e2e:install          # first time
npm run test:e2e:smoke            # dev server
npm run build
GITHUB_ACTIONS=true npm run test:e2e:verify   # production standalone (matches CI server)
```

E2E PDF fixtures are generated at runtime under `e2e/fixtures/` (gitignored).

## CI

`.github/workflows/ci.yml`:

1. lint → typecheck → **test:coverage** → audit → build → Playwright E2E

Coverage thresholds are set in `vitest.config.ts` on `src/lib/**` and `src/app/api/**`. Raise them as more modules gain tests.

## Local full check

```bash
make ci
# or
npm run lint && npm run typecheck && npm run test:coverage && npm run build && npm run test:e2e
```

## Adding tests safely

- **Do** add tests against public service functions and API route handlers.
- **Do** use `src/test/pdf-fixtures.ts` for PDF bytes.
- **Do not** change merge/compress/pdf-to-word/LibreOffice conversion implementations as part of test work — file bugs separately if a test exposes a real defect.
