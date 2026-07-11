"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface OrgRow {
  id: string;
  name: string;
  seat_limit: number;
  plan_status: string | null;
  plan_expires_at: string | null;
  created_at: string;
  [key: string]: unknown;
}

function planBadgeVariant(status: string | null): "success" | "warning" | "default" {
  if (status === "active") return "success";
  if (status === "past_due") return "warning";
  return "default";
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      const res = await fetch(`/api/admin/organizations?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setOrganizations(json.organizations ?? []);
      } else {
        setOrganizations([]);
      }
    } catch {
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const columns: Column<OrgRow>[] = [
    {
      key: "name",
      label: "Organization",
      render: (row) => (
        <div>
          <p className="font-medium text-pd-foreground">{row.name}</p>
          <p className="text-xs text-pd-muted">{row.id}</p>
        </div>
      ),
    },
    {
      key: "plan_status",
      label: "Plan",
      render: (row) => (
        <Badge variant={planBadgeVariant(row.plan_status)}>
          {row.plan_status ?? "inactive"}
        </Badge>
      ),
    },
    {
      key: "seat_limit",
      label: "Seats",
      render: (row) => row.seat_limit,
    },
    {
      key: "plan_expires_at",
      label: "Expires",
      render: (row) =>
        row.plan_expires_at
          ? new Date(row.plan_expires_at).toLocaleDateString()
          : "—",
    },
    {
      key: "created_at",
      label: "Created",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-pd-foreground">Organizations</h1>
        <p className="mt-1 text-sm text-pd-muted">
          Team plans, seat limits, and billing status for enterprise customers.
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pd-muted" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by organization name…"
          className="w-full rounded-lg border border-pd-border bg-pd-background py-2 pl-10 pr-3 text-sm"
        />
      </div>

      <DataTable columns={columns} data={organizations} loading={loading} emptyMessage="No organizations found." />
    </div>
  );
}
