"use client";

interface ConfidenceDatum {
  skill: string;
  confidence: number | null;
  status: "done" | "pending";
}

interface ConfidenceBarsProps {
  data: ConfidenceDatum[];
}

function confidenceLabel(value: number | null, status: "done" | "pending") {
  if (status === "pending" || value === null) {
    return "Pending";
  }

  if (value >= 0.85) {
    return "High";
  }

  if (value >= 0.65) {
    return "Medium";
  }

  return "Low";
}

export function ConfidenceBars({ data }: ConfidenceBarsProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Confidence by Skill
      </h3>
      <div className="space-y-3">
        {data.map((entry) => {
          const value = entry.confidence ?? 0;
          const width = Math.round(value * 100);

          return (
            <div key={entry.skill} className="space-y-1">
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span className="capitalize">{entry.skill}</span>
                <span>{confidenceLabel(entry.confidence, entry.status)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-teal-600 transition-all"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
