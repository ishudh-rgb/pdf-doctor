"use client";

import { RouteError } from "@/components/common/route-error";

export default function AdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Admin panel error"
      description="Something went wrong loading the admin panel. Please try again."
    />
  );
}
