"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";

interface Setting {
  key: string;
  value: string;
  label: string;
  description: string;
  type: "number" | "toggle";
}

const settingsConfig: Omit<Setting, "value">[] = [
  {
    key: "free_daily_file_limit",
    label: "Free Daily File Limit",
    description: "Maximum number of files a free user can process per day",
    type: "number",
  },
  {
    key: "free_max_file_size_mb",
    label: "Free Max File Size (MB)",
    description: "Maximum file size in MB for free tier users",
    type: "number",
  },
  {
    key: "pro_max_file_size_mb",
    label: "Pro Max File Size (MB)",
    description: "Maximum file size in MB for Pro tier users",
    type: "number",
  },
  {
    key: "free_daily_ai_limit",
    label: "Free Daily AI Limit",
    description: "Number of AI summarizer uses per day for free users",
    type: "number",
  },
  {
    key: "ads_enabled",
    label: "Ads Enabled",
    description: "Show advertisements to free tier users",
    type: "toggle",
  },
  {
    key: "maintenance_mode",
    label: "Maintenance Mode",
    description: "Put the site in maintenance mode (users will see a maintenance page)",
    type: "toggle",
  },
  {
    key: "file_retention_hours",
    label: "File Retention Hours",
    description: "Hours before uploaded files are automatically deleted",
    type: "number",
  },
];

const defaultValues: Record<string, string> = {
  free_daily_file_limit: "5",
  free_max_file_size_mb: "25",
  pro_max_file_size_mb: "200",
  free_daily_ai_limit: "1",
  ads_enabled: "true",
  maintenance_mode: "false",
  file_retention_hours: "2",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>(defaultValues);
  const [originalSettings, setOriginalSettings] = useState<Record<string, string>>(defaultValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const json = await res.json();
          const map: Record<string, string> = {};
          for (const s of json.settings || []) {
            map[s.key] = s.value;
          }
          const merged = { ...defaultValues, ...map };
          setSettings(merged);
          setOriginalSettings(merged);
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function handleSave() {
    setSaving(true);
    try {
      const changed = Object.entries(settings).filter(
        ([key, value]) => originalSettings[key] !== value
      );

      if (changed.length === 0) {
        setToast({ type: "success", message: "No changes to save." });
        setSaving(false);
        return;
      }

      for (const [key, value] of changed) {
        await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
      }

      setOriginalSettings({ ...settings });
      setToast({ type: "success", message: "Settings saved successfully!" });
    } catch {
      setToast({ type: "error", message: "Failed to save settings. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-pd-foreground">Settings</h2>
        <div className="space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded bg-pd-border" />
                  <div className="h-3 w-64 rounded bg-pd-border/60" />
                </div>
                <div className="h-10 w-24 rounded-xl bg-pd-border/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-pd-foreground">Settings</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-pd-brand px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-pd-brand-hover disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </button>
      </div>

      <div className="space-y-4">
        {settingsConfig.map((config) => (
          <div
            key={config.key}
            className="rounded-2xl bg-pd-surface border border-pd-border shadow-sm p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <label
                  htmlFor={config.key}
                  className="text-sm font-semibold text-pd-foreground"
                >
                  {config.label}
                </label>
                <p className="mt-0.5 text-xs text-pd-muted">{config.description}</p>
              </div>

              {config.type === "toggle" ? (
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      [config.key]: prev[config.key] === "true" ? "false" : "true",
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    settings[config.key] === "true" ? "bg-pd-brand" : "bg-pd-border"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-pd-surface shadow transition-transform ${
                      settings[config.key] === "true" ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              ) : (
                <input
                  id={config.key}
                  type="number"
                  value={settings[config.key] || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, [config.key]: e.target.value }))
                  }
                  className="w-28 rounded-xl border border-pd-border px-3 py-2 text-sm text-pd-foreground focus:border-pd-brand focus:outline-none focus:ring-2 focus:ring-pd-brand/20"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
