"use client";

import { useState, useEffect, useCallback } from "react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils/cn";
import { Eye, UserCog, ShieldBan, ShieldCheck, Search } from "lucide-react";

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  plan: "free" | "pro";
  files_processed: number;
  status: "active" | "blocked";
  created_at: string;
  last_login_at: string | null;
  total_usage_count: number;
  [key: string]: unknown;
}

const mockUsers: UserRow[] = Array.from({ length: 47 }).map((_, i) => ({
  id: `usr_${i + 1}`,
  full_name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  plan: i % 5 === 0 ? "pro" : "free",
  files_processed: Math.floor(Math.random() * 500),
  status: i % 12 === 0 ? "blocked" : "active",
  created_at: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString(),
  last_login_at: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 7 * 86400000).toISOString() : null,
  total_usage_count: Math.floor(Math.random() * 1000),
}));

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "free" | "pro">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?plan=${filter}&search=${searchQuery}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users);
      } else {
        setUsers(mockUsers);
      }
    } catch {
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    if (filter !== "all" && u.plan !== filter) return false;
    return true;
  });

  async function handleChangePlan(userId: string, newPlan: "free" | "pro") {
    setActionLoading(userId);
    try {
      await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u)));
    } catch {
      // Silently handle
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleBlock(userId: string, currentStatus: string) {
    setActionLoading(userId);
    const newStatus = currentStatus === "active" ? "blocked" : "active";
    try {
      await fetch(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus as "active" | "blocked" } : u)));
    } catch {
      // Silently handle
    } finally {
      setActionLoading(null);
    }
  }

  const columns: Column<UserRow>[] = [
    {
      key: "full_name",
      label: "Name",
      sortable: true,
      render: (row) => <span className="font-medium text-pd-foreground">{row.full_name}</span>,
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (row) => <span className="text-pd-muted">{row.email}</span>,
    },
    {
      key: "plan",
      label: "Plan",
      sortable: true,
      render: (row) => (
        <Badge variant={row.plan === "pro" ? "pro" : "default"}>
          {row.plan === "pro" ? "Pro" : "Free"}
        </Badge>
      ),
    },
    {
      key: "files_processed",
      label: "Files",
      sortable: true,
      render: (row) => <span>{row.files_processed.toLocaleString()}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <Badge variant={row.status === "active" ? "success" : "error"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedUser(row); }}
            className="p-1.5 rounded-lg text-pd-muted hover:bg-pd-background hover:text-pd-brand transition-colors cursor-pointer"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleChangePlan(row.id, row.plan === "pro" ? "free" : "pro");
            }}
            disabled={actionLoading === row.id}
            className="p-1.5 rounded-lg text-pd-muted hover:bg-pd-background hover:text-pd-brand transition-colors cursor-pointer disabled:opacity-50"
            title="Change Plan"
          >
            <UserCog className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleBlock(row.id, row.status);
            }}
            disabled={actionLoading === row.id}
            className={cn(
              "p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50",
              row.status === "active"
                ? "text-pd-muted hover:bg-red-50 hover:text-red-600"
                : "text-pd-muted hover:bg-green-50 hover:text-green-600"
            )}
            title={row.status === "active" ? "Block" : "Unblock"}
          >
            {row.status === "active" ? (
              <ShieldBan className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-pd-foreground">Users</h2>
        <div className="flex items-center gap-2">
          {(["all", "free", "pro"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                filter === f
                  ? "bg-pd-brand text-white"
                  : "bg-pd-surface text-pd-muted border border-pd-border hover:bg-pd-background"
              )}
            >
              {f === "all" ? "All" : f === "free" ? "Free" : "Pro"}
            </button>
          ))}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pd-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-pd-border bg-pd-surface text-sm text-pd-foreground placeholder:text-pd-muted focus:border-pd-brand focus:outline-none focus:ring-2 focus:ring-pd-brand/20 transition-colors"
        />
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        searchable={false}
        pageSize={10}
        emptyMessage="No users found"
        onRowClick={(row) => setSelectedUser(row)}
      />

      <Modal
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-pd-muted">Name</p>
                <p className="text-sm font-medium text-pd-foreground">{selectedUser.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-pd-muted">Email</p>
                <p className="text-sm font-medium text-pd-foreground">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-pd-muted">Plan</p>
                <Badge variant={selectedUser.plan === "pro" ? "pro" : "default"}>
                  {selectedUser.plan === "pro" ? "Pro" : "Free"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-pd-muted">Status</p>
                <Badge variant={selectedUser.status === "active" ? "success" : "error"}>
                  {selectedUser.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-pd-muted">Files Processed</p>
                <p className="text-sm font-medium text-pd-foreground">{selectedUser.files_processed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-pd-muted">Total Usage</p>
                <p className="text-sm font-medium text-pd-foreground">{selectedUser.total_usage_count.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-pd-muted">Joined</p>
                <p className="text-sm font-medium text-pd-foreground">
                  {new Date(selectedUser.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-pd-muted">Last Login</p>
                <p className="text-sm font-medium text-pd-foreground">
                  {selectedUser.last_login_at
                    ? new Date(selectedUser.last_login_at).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-pd-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleChangePlan(selectedUser.id, selectedUser.plan === "pro" ? "free" : "pro")}
                loading={actionLoading === selectedUser.id}
              >
                {selectedUser.plan === "pro" ? "Downgrade to Free" : "Upgrade to Pro"}
              </Button>
              <Button
                variant={selectedUser.status === "active" ? "outline" : "secondary"}
                size="sm"
                onClick={() => handleToggleBlock(selectedUser.id, selectedUser.status)}
                loading={actionLoading === selectedUser.id}
              >
                {selectedUser.status === "active" ? "Block User" : "Unblock User"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
