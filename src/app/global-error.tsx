"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void import("@/lib/ops/sentry").then(({ captureException }) => {
      captureException(error, { digest: error.digest });
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 font-sans">
        <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
        <p className="max-w-md text-center text-sm text-gray-600">
          An unexpected error occurred. Please try again or return to the homepage.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
