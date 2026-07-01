import { Wrench } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MaintenancePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
        <Wrench className="h-8 w-8 text-amber-600" />
      </div>
      <h1 className="text-2xl font-bold text-pd-foreground">We&apos;ll be back soon</h1>
      <p className="mt-3 text-pd-muted">
        OnlyMyPDF is temporarily down for scheduled maintenance. Your files are safe — please
        check back in a little while.
      </p>
      <Link href="/" className="mt-8">
        <Button variant="outline">Return to homepage</Button>
      </Link>
    </div>
  );
}
