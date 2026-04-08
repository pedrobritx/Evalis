"use client";

import { useState } from "react";

interface UsageEntry {
  id: string;
  date: string;
  dailyUsed: number;
  dailyLimit: number;
  perStudentUsed: number;
  perStudentLimit: number;
}

interface AiSettingsPanelProps {
  initialProvider: "OPENAI" | "OLLAMA" | "CUSTOM";
  initialHasStoredKey: boolean;
  initialUsage: UsageEntry[];
}

export function AiSettingsPanel({
  initialProvider,
  initialHasStoredKey,
  initialUsage,
}: AiSettingsPanelProps) {
  const [provider, setProvider] = useState(initialProvider);
  const [apiKey, setApiKey] = useState("");
  const [hasStoredKey, setHasStoredKey] = useState(initialHasStoredKey);
  const [usage] = useState(initialUsage);
  const [status, setStatus] = useState<string | null>(null);

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);

    const response = await fetch("/api/teacher/ai-settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
        apiKey: apiKey || undefined,
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      setStatus(json.error ?? "Failed to save settings");
      return;
    }

    setHasStoredKey(json.hasStoredKey);
    setApiKey("");
    setStatus("Settings saved");
  }

  return (
    <>
      <form onSubmit={saveSettings} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <label className="block text-sm text-slate-700">
          Provider
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value as typeof initialProvider)}
            className="mt-1 w-full rounded border border-slate-300 p-2"
          >
            <option value="OPENAI">OpenAI</option>
            <option value="OLLAMA">Ollama</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </label>

        <label className="block text-sm text-slate-700">
          API Key (optional if already stored)
          <input
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            type="password"
            className="mt-1 w-full rounded border border-slate-300 p-2"
          />
        </label>

        <p className="text-sm text-slate-600">Stored key: {hasStoredKey ? "Yes" : "No"}</p>

        <button className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white" type="submit">
          Save AI Settings
        </button>

        {status ? <p className="text-sm text-slate-700">{status}</p> : null}
      </form>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Usage Snapshot</h2>
        <div className="mt-3 space-y-2 text-sm">
          {usage.length === 0 ? (
            <p className="text-slate-600">No usage entries yet.</p>
          ) : (
            usage.map((entry) => (
              <div key={entry.id} className="rounded border border-slate-200 p-3">
                <p className="font-medium text-slate-800">{new Date(entry.date).toLocaleDateString()}</p>
                <p className="text-slate-600">
                  Daily: {entry.dailyUsed}/{entry.dailyLimit} · Per-student: {entry.perStudentUsed}/
                  {entry.perStudentLimit}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
