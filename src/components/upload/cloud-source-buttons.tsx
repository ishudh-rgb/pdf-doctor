"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  isDropboxConfigured,
  pickFilesFromDropbox,
} from "@/lib/cloud-upload/dropbox";
import {
  isGoogleDriveConfigured,
  pickFilesFromGoogleDrive,
} from "@/lib/cloud-upload/google-drive";

function GoogleDriveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M7.71 2.5 2.5 11.63h5.21L12.92 2.5H7.71zm8.58 0h-5.21l5.21 9.13h5.21L16.29 2.5zM2.5 13.37 7.71 22.5h5.21l-5.21-9.13H2.5zm10.42 0 5.21 9.13h5.21l-5.21-9.13h-5.21z"
      />
    </svg>
  );
}

function DropboxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M6 2.5 12 6.5l6-4v4l-6 4-6-4v-4zm12 7 6 4v4l-6 4-6-4v-4l6-4zm-12 0 6 4v4l-6 4-6-4v-4l6-4zM6 17.5l6 4 6-4v4l-6 4-6-4v-4z"
      />
    </svg>
  );
}

type CloudSourceButtonsProps = {
  onFilesSelected: (files: File[]) => void;
  onError?: (message: string) => void;
  acceptExtensions?: string[];
  mimeTypes?: string;
  multiple?: boolean;
  className?: string;
  variant?: "inline" | "stacked";
};

export function CloudSourceButtons({
  onFilesSelected,
  onError,
  acceptExtensions = [".pdf"],
  mimeTypes = "application/pdf",
  multiple = false,
  className,
  variant = "inline",
}: CloudSourceButtonsProps) {
  const [loading, setLoading] = useState<"drive" | "dropbox" | null>(null);

  async function handleDrive() {
    if (!isGoogleDriveConfigured()) {
      onError?.(
        "Google Drive is not set up. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_API_KEY to .env.local"
      );
      return;
    }
    setLoading("drive");
    try {
      const files = await pickFilesFromGoogleDrive({ mimeTypes, multiple });
      if (files.length > 0) onFilesSelected(files);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Google Drive failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleDropbox() {
    if (!isDropboxConfigured()) {
      onError?.(
        "Dropbox is not set up. Add NEXT_PUBLIC_DROPBOX_APP_KEY to .env.local"
      );
      return;
    }
    setLoading("dropbox");
    try {
      const files = await pickFilesFromDropbox({
        extensions: acceptExtensions,
        multiple,
      });
      if (files.length > 0) onFilesSelected(files);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Dropbox failed");
    } finally {
      setLoading(null);
    }
  }

  const btnClass =
    "inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-pd-border bg-pd-surface px-3 py-2.5 text-sm font-medium text-pd-foreground transition hover:border-pd-brand/40 hover:bg-pd-brand-muted disabled:opacity-60";

  return (
    <div className={cn("w-full", className)}>
      <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-pd-muted">
        Or import from cloud
      </p>
      <div
        className={cn(
          "flex gap-2",
          variant === "stacked" ? "flex-col" : "flex-col sm:flex-row"
        )}
      >
        <button
          type="button"
          onClick={handleDrive}
          disabled={loading !== null}
          className={btnClass}
        >
          {loading === "drive" ? (
            <Loader2 className="h-4 w-4 animate-spin text-pd-brand" />
          ) : (
            <GoogleDriveIcon className="h-4 w-4 text-pd-brand" />
          )}
          Google Drive
        </button>
        <button
          type="button"
          onClick={handleDropbox}
          disabled={loading !== null}
          className={btnClass}
        >
          {loading === "dropbox" ? (
            <Loader2 className="h-4 w-4 animate-spin text-pd-brand" />
          ) : (
            <DropboxIcon className="h-4 w-4 text-pd-brand" />
          )}
          Dropbox
        </button>
      </div>
    </div>
  );
}
