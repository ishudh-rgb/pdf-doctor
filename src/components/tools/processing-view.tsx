"use client";

import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface ProcessingViewProps {
  progress: number;
  message?: string;
  onCancel?: () => void;
  className?: string;
}

export function ProcessingView({
  progress,
  message = "Processing your file...",
  onCancel,
  className,
}: ProcessingViewProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl bg-white p-10 shadow-sm border border-gray-100",
        className
      )}
    >
      <div className="relative mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-50 to-blue-50">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      </div>

      <p className="mb-6 text-base font-medium text-gray-900">{message}</p>

      <div className="w-full max-w-xs">
        <Progress value={progress} showPercentage size="md" />
      </div>

      {onCancel && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="mt-6 text-gray-500"
        >
          Cancel
        </Button>
      )}
    </div>
  );
}
