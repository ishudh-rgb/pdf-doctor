"use client";

import { cn } from "@/lib/utils/cn";
import { Menu, Bell, Shield } from "lucide-react";

interface AdminHeaderProps {
  onMenuClick: () => void;
  className?: string;
}

export function AdminHeader({ onMenuClick, className }: AdminHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center justify-between border-b border-pd-border bg-pd-surface px-4 lg:px-6",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="cursor-pointer rounded-lg p-2 text-pd-muted transition-colors hover:bg-pd-background lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-pd-brand" />
          <h1 className="text-lg font-semibold text-pd-foreground">Only4PDF Admin</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative cursor-pointer rounded-lg p-2 text-pd-muted transition-colors hover:bg-pd-background"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-pd-danger" />
        </button>
        <div className="flex items-center gap-2 border-l border-pd-border pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pd-brand text-xs font-bold text-white">
            A
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-pd-foreground">Admin</p>
            <p className="text-xs text-pd-muted">admin@only4pdf.com</p>
          </div>
        </div>
      </div>
    </header>
  );
}
