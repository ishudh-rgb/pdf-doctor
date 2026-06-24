import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo/metadata";
import { AdminShell } from "./admin-shell";

export const metadata: Metadata = NOINDEX_METADATA;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
