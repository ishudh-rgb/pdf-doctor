import type { Metadata } from "next";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { NOINDEX_METADATA } from "@/lib/seo/metadata";

export const metadata: Metadata = NOINDEX_METADATA;

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
