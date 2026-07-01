"use client";

import { RouteError } from "@/components/common/route-error";

export default function DashboardError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Dashboard unavailable"
      description="We couldn't load your dashboard. Please try again."
    />
  );
}
