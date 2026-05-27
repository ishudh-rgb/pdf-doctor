"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Clock,
  Settings,
  Tag,
  CreditCard,
  AlertTriangle,
  Trash2,
  ArrowLeft,
  X,
  FileText,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Jobs", href: "/admin/jobs", icon: Clock },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Coupons", href: "/admin/coupons", icon: Tag },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Error Logs", href: "/admin/errors", icon: AlertTriangle },
  { label: "Cleanup", href: "/admin/cleanup", icon: Trash2 },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[250px] flex-col border-r border-pd-border bg-pd-surface transition-transform duration-300 ease-in-out",
          "lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-pd-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pd-brand">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-pd-foreground">PDF Doctor</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto cursor-pointer rounded-lg p-1.5 text-pd-muted hover:bg-pd-background lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-pd-brand-muted text-pd-brand"
                    : "text-pd-muted hover:bg-pd-background hover:text-pd-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active ? "text-pd-brand" : "text-pd-muted")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-pd-border px-3 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-pd-muted transition-colors hover:bg-pd-background hover:text-pd-foreground"
          >
            <ArrowLeft className="h-5 w-5 text-pd-muted" />
            Back to Site
          </Link>
        </div>
      </aside>
    </>
  );
}
