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
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Error Logs</h1>
        <div className="flex items-center gap-3">
          <select
            value={filterTool}
            onChange={(e) => setFilterTool(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Tools</option>
            {toolNames.map((tool) => (
              <option key={tool} value={tool!}>{tool}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredErrors.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 shadow-sm text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-green-400" />
          <p className="mt-4 font-medium text-gray-700">No errors found</p>
          <p className="mt-1 text-sm text-gray-500">Everything is running smoothly!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredErrors.map((err) => (
            <div key={err.id} className="rounded-2xl bg-white shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === err.id ? null : err.id)}
                className="w-full px-6 py-4 text-left flex items-center gap-4 hover:bg-gray-50 cursor-pointer"
              >
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-red-100 text-red-700 px-2 py-0.5 rounded">{err.error_type}</span>
                    {err.tool_name && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{err.tool_name}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 truncate">{err.error_message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(err.created_at).toLocaleString()}
                    {err.user_id && ` • User: ${err.user_id.slice(0, 8)}...`}
                  </p>
                </div>
                {expandedId === err.id ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {expandedId === err.id && (
                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Full Error Message</h4>
                  <p className="text-sm text-gray-700 mb-4">{err.error_message}</p>

                  {err.stack_trace && (
                    <>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Stack Trace</h4>
                      <pre className="text-xs text-gray-600 bg-white rounded-lg p-4 overflow-x-auto border border-gray-200 whitespace-pre-wrap">
                        {err.stack_trace}
                      </pre>
                    </>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Error Type: </span>
                      <span className="font-medium">{err.error_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tool: </span>
                      <span className="font-medium">{err.tool_name || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">User: </span>
                      <span className="font-medium">{err.user_id || "Guest"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date: </span>
                      <span className="font-medium">{new Date(err.created_at).toLocaleString()}</span>
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
