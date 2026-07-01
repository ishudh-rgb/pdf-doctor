import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo/metadata";

export const metadata: Metadata = NOINDEX_METADATA;

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
