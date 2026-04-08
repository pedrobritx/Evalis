"use client";

import { useMemo, useState } from "react";

const SKILLS = ["reading", "listening", "usee", "writing"] as const;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export interface ItemEditorValue {
  id?: string;
  skill: "reading" | "listening" | "usee" | "writing";
  subskill: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  difficulty: number;
  type: string;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  active: boolean;
}

const DEFAULT_VALUE: ItemEditorValue = {
  skill: "reading",
  subskill: "inference",
  level: "B1",
  difficulty: 0,
  type: "multiple_choice",
  question: "",
  options: [""],
  answer: "",
  explanation: "",
  active: true,
};

interface ItemEditorProps {
  onSave: (value: ItemEditorValue) => Promise<void>;
  initialValue?: ItemEditorValue;
}

export function ItemEditor({ onSave, initialValue }: ItemEditorProps) {
  const [value, setValue] = useState<ItemEditorValue>(initialValue ?? DEFAULT_VALUE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return value.question.trim().length > 4 && value.answer.trim().length > 0;
  }, [value.answer, value.question]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError("Question and answer are required.");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        ...value,
        options: value.options.map((opt) => opt.trim()).filter(Boolean),
      });
      setValue(DEFAULT_VALUE);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm text-slate-700">
          Skill
          <select
            value={value.skill}
            onChange={(event) =>
              setValue((current) => ({ ...current, skill: event.target.value as ItemEditorValue["skill"] }))
            }
            className="mt-1 w-full rounded border border-slate-300 p-2"
          >
            {SKILLS.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          Level
          <select
            value={value.level}
            onChange={(event) =>
              setValue((current) => ({ ...current, level: event.target.value as ItemEditorValue["level"] }))
            }
            className="mt-1 w-full rounded border border-slate-300 p-2"
          >
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          Difficulty
          <input
            type="number"
            value={value.difficulty}
            step={0.1}
            min={-3}
            max={3}
            onChange={(event) =>
              setValue((current) => ({ ...current, difficulty: Number(event.target.value) }))
            }
            className="mt-1 w-full rounded border border-slate-300 p-2"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-slate-700">
          Subskill
          <input
            value={value.subskill}
            onChange={(event) => setValue((current) => ({ ...current, subskill: event.target.value }))}
            className="mt-1 w-full rounded border border-slate-300 p-2"
          />
        </label>

        <label className="text-sm text-slate-700">
          Type
          <input
            value={value.type}
            onChange={(event) => setValue((current) => ({ ...current, type: event.target.value }))}
            className="mt-1 w-full rounded border border-slate-300 p-2"
          />
        </label>
      </div>

      <label className="block text-sm text-slate-700">
        Question
        <textarea
          value={value.question}
          onChange={(event) => setValue((current) => ({ ...current, question: event.target.value }))}
          rows={3}
          className="mt-1 w-full rounded border border-slate-300 p-2"
        />
      </label>

      <label className="block text-sm text-slate-700">
        Options (one per line)
        <textarea
          value={value.options.join("\n")}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              options: event.target.value.split("\n"),
            }))
          }
          rows={4}
          className="mt-1 w-full rounded border border-slate-300 p-2"
        />
      </label>

      <label className="block text-sm text-slate-700">
        Correct Answer
        <input
          value={value.answer}
          onChange={(event) => setValue((current) => ({ ...current, answer: event.target.value }))}
          className="mt-1 w-full rounded border border-slate-300 p-2"
        />
      </label>

      <label className="block text-sm text-slate-700">
        Explanation
        <textarea
          value={value.explanation ?? ""}
          onChange={(event) => setValue((current) => ({ ...current, explanation: event.target.value }))}
          rows={2}
          className="mt-1 w-full rounded border border-slate-300 p-2"
        />
      </label>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <button
        type="submit"
        disabled={saving || !canSubmit}
        className="rounded bg-teal-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {saving ? "Saving..." : "Save Item"}
      </button>
    </form>
  );
}
