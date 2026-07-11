"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL } from "@/config/constants";

export default function AccountSuspendedPage() {
  return (
    <main className="pd-container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-pd-foreground">Account suspended</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-pd-muted">
        Your OnlyMyPDF account has been suspended by an administrator. Tool access and
        dashboard features are disabled until the suspension is lifted.
      </p>
      <p className="mt-4 text-sm text-pd-muted">
        Contact{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-pd-brand hover:underline">
          {SUPPORT_EMAIL}
        </a>{" "}
        if you believe this is a mistake.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/">
          <Button variant="outline">Back to home</Button>
        </Link>
        <Link href="/contact">
          <Button>Contact support</Button>
        </Link>
      </div>
    </main>
  );
}
