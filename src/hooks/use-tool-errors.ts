"use client";

import { useCallback } from "react";
import { useTranslation } from "@/i18n";
import {
  resolveClientToolError,
  resolveToolApiError,
  type ToolErrorPayload,
} from "@/lib/client/resolve-tool-error";

export function useToolErrors() {
  const { t, language } = useTranslation();

  const resolveApiError = useCallback(
    (payload: string | ToolErrorPayload | null | undefined, fallbackKey = "errors.generic") =>
      resolveToolApiError(payload, t, language, fallbackKey),
    [t, language]
  );

  const resolveCatchError = useCallback(
    (err: unknown, options?: { timeoutKey?: string; networkKey?: string }) =>
      resolveClientToolError(err, t, language, options),
    [t, language]
  );

  return {
    t,
    language,
    resolveApiError,
    resolveCatchError,
    errors: {
      generic: t("errors.generic"),
      network: t("errors.networkError"),
      processing: t("errors.processingFailed"),
      fileTooBig: (size: number | string) => t("errors.fileTooBig", { size }),
      invalidFileType: t("errors.invalidFileType"),
      emptyFile: t("errors.emptyFile"),
    },
  };
}
