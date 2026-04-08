import { notFound } from "next/navigation";

import { ConfidenceBars } from "@/components/charts/confidence-bars";
import { SkillRadarChart } from "@/components/charts/radar-chart";
import { prisma } from "@/lib/prisma";

interface ResultsPageProps {
  params: Promise<{ sessionId: string }>;
}

export const dynamic = "force-dynamic";

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { sessionId } = await params;

  const report = await prisma.report.findUnique({
    where: { sessionId },
  });

  if (!report) {
    notFound();
  }

  const perSkill = report.perSkill as Record<
    string,
    { level: string; confidence: number | null; status: "done" | "pending" }
  >;

  const feedback = report.feedback as Record<string, string>;
  const radarData = report.radarData as Array<{ skill: string; value: number }>;
  const confidenceData = report.confidenceData as Array<{
    skill: string;
    confidence: number | null;
    status: "done" | "pending";
  }>;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-3">
        <article>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{report.overallLevel}</p>
        </article>
        <article>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested Course</p>
          <p className="mt-2 text-3xl font-bold text-teal-700">{report.suggestedCourseLevel}</p>
        </article>
        <article>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Provisional</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {report.provisionalOverallLevel ?? "No"}
          </p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <SkillRadarChart data={radarData} />
        <ConfidenceBars data={confidenceData} />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {Object.entries(perSkill).map(([skill, data]) => (
          <article key={skill} className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{skill}</h3>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{data.level}</p>
            <p className="mt-3 text-sm text-slate-700">{feedback[skill]}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
