"use client";

import { useCallback } from "react";
import { getMaxFileSizeMB } from "@/config/constants";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/i18n";
import { validateFileSize } from "@/lib/utils/file";

/** One-line upload size copy for tool dropzones (plan-aware). */
export function useToolUploadSizeLine(): string {
  const { isPro } = useAuth();
  const { t } = useTranslation();
  const freeMb = String(getMaxFileSizeMB(false));
  const proMb = String(getMaxFileSizeMB(true));

  if (isPro) {
    return t("toolPage.uploadSizePro", { pro: proMb });
  }

  return t("toolPage.uploadSizeFree", { free: freeMb, pro: proMb });
}

/** Keep "25 MB" / "200 MB" on one line in narrow dropzones. */
export function formatUploadSizeDisplay(text: string): string {
  return text.replace(/(\d+)\s+(MB)/g, "$1\u00a0$2");
}

/** Optional format note + size line, e.g. "PDF only · Free up to 25 MB…" */
export function useToolUploadSubHint(formatNote?: string): string {
  const sizeLine = useToolUploadSizeLine();
  if (!formatNote?.trim()) return sizeLine;
  return `${formatNote.trim()} · ${sizeLine}`;
}

export function useToolUploadLimits() {
  const { isPro } = useAuth();
  const maxSizeMB = getMaxFileSizeMB(isPro);
  const sizeLine = useToolUploadSizeLine();

  const validateFile = useCallback(
    (file: File) => validateFileSize(file, maxSizeMB),
    [maxSizeMB]
  );

  return { isPro, maxSizeMB, sizeLine, validateFile };
}
