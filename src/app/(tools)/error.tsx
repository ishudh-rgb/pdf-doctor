"use client";

import { RouteError } from "@/components/common/route-error";

export default function ToolsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Tool unavailable"
      description="This tool encountered an error. Please try again or pick another tool."
    />
  );
}
