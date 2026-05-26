"use client";

import { CheckCircle2, Download, Trash2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface ResultViewProps {
  fileName: string;
  fileSize: string;
  compressionRatio?: string;
  downloadUrl: string;
  onDelete?: () => void;
  relatedTools?: { name: string; href: string }[];
  className?: string;
}

export function ResultView({
  fileName,
  fileSize,
  compressionRatio,
  downloadUrl,
  onDelete,
  relatedTools,
  className,
}: ResultViewProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl bg-white p-10 shadow-sm border border-gray-100",
        className
      )}
    >
      {/* Success animation */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 animate-bounce-once">
        <CheckCircle2 className="h-8 w-8 text-green-500" />
      </div>

      <h2 className="text-xl font-semibold text-gray-900">
        Your file is ready!
      </h2>

      {/* File info */}
      <div className="mt-4 flex flex-col items-center gap-1 text-sm text-gray-500">
        <span className="font-medium text-gray-700">{fileName}</span>
        <span>{fileSize}</span>
        {compressionRatio && (
          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            {compressionRatio} smaller
          </span>
        )}
      </div>

      {/* Download button */}
      <a href={downloadUrl} download className="mt-6 w-full max-w-xs">
        <Button variant="default" size="xl" className="w-full">
          <Download className="h-5 w-5" />
          Download
        </Button>
      </a>

      {/* Secondary actions */}
      <div className="mt-4 flex items-center gap-3">
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Delete file now
          </Button>
        )}
        <Button variant="ghost" size="sm" disabled>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>

      {/* Related tools */}
      {relatedTools && relatedTools.length > 0 && (
        <div className="mt-8 w-full border-t border-gray-100 pt-6">
          <p className="mb-3 text-center text-sm font-medium text-gray-700">
            Need more? Try these tools:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {relatedTools.map((tool) => (
              <a
                key={tool.name}
                href={tool.href}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                {tool.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
