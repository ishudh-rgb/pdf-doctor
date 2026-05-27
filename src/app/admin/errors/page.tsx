"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Loader2, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

interface ErrorLogEntry {
  id: string;
  error_type: string;
  error_message: string;
  tool_name: string | null;
  user_id: string | null;
  stack_trace: string | null;
  created_at: string;
}

export default function AdminErrorsPage() {
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterTool, setFilterTool] = useState("");

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
    try {
      const res = await fetch("/api/admin/jobs?type=errors");
      if (res.ok) {
        const data = await res.json();
        setErrors(data.errors ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filteredErrors = filterTool
    ? errors.filter((e) => e.tool_name === filterTool)
    : errors;

  const toolNames = [...new Set(errors.filter((e) => e.tool_name).map((e) => e.tool_name))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-pd-muted" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-pd-foreground">Error Logs</h1>
        <div className="flex items-center gap-3">
          <select
            value={filterTool}
            onChange={(e) => setFilterTool(e.target.value)}
            className="rounded-lg border border-pd-border bg-pd-surface px-3 py-2 text-sm text-pd-foreground"
          >
            <option value="">All Tools</option>
            {toolNames.map((tool) => (
              <option key={tool} value={tool!}>{tool}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredErrors.length === 0 ? (
        <div className="rounded-2xl bg-pd-surface p-12 shadow-sm text-center border border-pd-border">
          <AlertTriangle className="mx-auto h-12 w-12 text-green-400" />
          <p className="mt-4 font-medium text-pd-muted">No errors found</p>
          <p className="mt-1 text-sm text-pd-muted">Everything is running smoothly!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredErrors.map((err) => (
            <div key={err.id} className="rounded-2xl bg-pd-surface shadow-sm overflow-hidden border border-pd-border">
              <button
                onClick={() => setExpandedId(expandedId === err.id ? null : err.id)}
                className="w-full px-6 py-4 text-left flex items-center gap-4 hover:bg-pd-background cursor-pointer"
              >
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-red-100 text-red-700 px-2 py-0.5 rounded">{err.error_type}</span>
                    {err.tool_name && (
                      <span className="text-xs bg-pd-border text-pd-muted px-2 py-0.5 rounded">{err.tool_name}</span>
                    )}
                  </div>
                  <p className="text-sm text-pd-muted truncate">{err.error_message}</p>
                  <p className="text-xs text-pd-muted mt-1">
                    {new Date(err.created_at).toLocaleString()}
                    {err.user_id && ` • User: ${err.user_id.slice(0, 8)}...`}
                  </p>
                </div>
                {expandedId === err.id ? (
                  <ChevronUp className="h-4 w-4 text-pd-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-pd-muted" />
                )}
              </button>

              {expandedId === err.id && (
                <div className="border-t border-pd-border px-6 py-4 bg-pd-background">
                  <h4 className="text-xs font-semibold text-pd-muted uppercase mb-2">Full Error Message</h4>
                  <p className="text-sm text-pd-muted mb-4">{err.error_message}</p>

                  {err.stack_trace && (
                    <>
                      <h4 className="text-xs font-semibold text-pd-muted uppercase mb-2">Stack Trace</h4>
                      <pre className="text-xs text-pd-muted bg-pd-surface rounded-lg p-4 overflow-x-auto border border-pd-border whitespace-pre-wrap">
                        {err.stack_trace}
                      </pre>
                    </>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-pd-muted">Error Type: </span>
                      <span className="font-medium text-pd-foreground">{err.error_type}</span>
                    </div>
                    <div>
                      <span className="text-pd-muted">Tool: </span>
                      <span className="font-medium text-pd-foreground">{err.tool_name || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-pd-muted">User: </span>
                      <span className="font-medium text-pd-foreground">{err.user_id || "Guest"}</span>
                    </div>
                    <div>
                      <span className="text-pd-muted">Date: </span>
                      <span className="font-medium text-pd-foreground">{new Date(err.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
