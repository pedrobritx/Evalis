"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { QuestionRenderer } from "@/components/test/question-renderer";

const SKILL_ORDER = ["reading", "listening", "usee", "writing"] as const;

type Skill = (typeof SKILL_ORDER)[number];

interface TestPageProps {
  params: Promise<{ sessionId: string; skill: Skill }>;
}

interface NextItemResponse {
  done: boolean;
  item: {
    id: string;
    skill: Skill;
    question: string;
    options?: string[];
    type: string;
    subskill: string;
    difficulty: number;
  } | null;
  estimate: {
    levelWithConfidence: string;
    confidence: number;
    itemsAnswered: number;
  };
}

export default function SkillTestPage({ params }: TestPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ sessionId: string; skill: Skill } | null>(null);
  const [payload, setPayload] = useState<NextItemResponse | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((value) => setResolvedParams(value));
  }, [params]);

  const nextSkillHref = useMemo(() => {
    if (!resolvedParams) {
      return "#";
    }

    const currentIndex = SKILL_ORDER.indexOf(resolvedParams.skill);

    if (currentIndex < 0 || currentIndex === SKILL_ORDER.length - 1) {
      return `/results/${resolvedParams.sessionId}`;
    }

    return `/test/${resolvedParams.sessionId}/${SKILL_ORDER[currentIndex + 1]}`;
  }, [resolvedParams]);

  const loadNextItem = useCallback(async () => {
    if (!resolvedParams) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/sessions/${resolvedParams.sessionId}/next-item?skill=${resolvedParams.skill}`,
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "Failed to load next item");
      }

      setPayload(json);
      setAnswer("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load item");
    } finally {
      setLoading(false);
    }
  }, [resolvedParams]);

  useEffect(() => {
    if (resolvedParams) {
      void loadNextItem();
    }
  }, [loadNextItem, resolvedParams]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!resolvedParams || !payload?.item || !answer.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/sessions/${resolvedParams.sessionId}/submit-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skill: resolvedParams.skill,
          itemId: payload.item.id,
          answer,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "Failed to submit answer");
      }

      await loadNextItem();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!resolvedParams || loading) {
    return <div className="mx-auto w-full max-w-3xl p-6 text-sm text-slate-600">Loading...</div>;
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6">
        <p className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
      </div>
    );
  }

  if (payload?.done || !payload?.item) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          {resolvedParams.skill.toUpperCase()} completed
        </h1>
        <p className="text-sm text-slate-700">
          Current estimate: <strong>{payload?.estimate.levelWithConfidence}</strong>
        </p>
        <Link
          href={nextSkillHref}
          className="inline-flex rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Continue
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
      <header className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Adaptive Placement</p>
        <h1 className="mt-1 text-xl font-semibold text-slate-900 capitalize">{resolvedParams.skill}</h1>
        <p className="mt-2 text-sm text-slate-700">
          Current estimate: <strong>{payload.estimate.levelWithConfidence}</strong> · Answered {" "}
          {payload.estimate.itemsAnswered} item(s)
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-medium text-slate-900">{payload.item.question}</p>
        <QuestionRenderer item={payload.item} answer={answer} onChange={setAnswer} />
        <button
          type="submit"
          disabled={submitting || !answer.trim()}
          className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitting ? "Submitting..." : "Submit Answer"}
        </button>
      </form>

      <p className="text-xs text-slate-500">
        Full mode provides more accurate placement than short mode because it uses more items.
      </p>
    </main>
  );
}
