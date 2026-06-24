"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.replace("/login?redirect=/admin");
          return;
        }
        const data = await res.json();
        if (data.user?.role !== "admin") {
          router.replace("/");
          return;
        }
        setAuthorized(true);
      } catch {
        router.replace("/login?redirect=/admin");
      } finally {
        setChecking(false);
      }
    }
    checkAdmin();
  }, [router]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-pd-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-pd-brand border-t-transparent" />
          <p className="text-sm text-pd-muted">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="pd-admin flex h-screen overflow-hidden bg-pd-background">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto p-4 lg:p-6" role="region" aria-label="Admin content">
          {children}
        </div>
      </div>
    </div>
  );
}
