import Link from "next/link";

import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const user = await getSessionUser();
  const teacher = user ? await prisma.teacher.findUnique({ where: { userId: user.id } }) : null;

  if (!teacher) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
        <h1 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h1>
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Sign in as a teacher account to access placement dashboards.
        </p>
      </main>
    );
  }

  const pendingWriting = await prisma.writingSubmission.findMany({
    where: {
      status: "PENDING",
      session: {
        student: {
          teacherId: teacher.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    include: {
      session: {
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  const recentReports = await prisma.report.findMany({
    where: {
      session: {
        student: {
          teacherId: teacher.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 8,
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h1>
          <p className="text-sm text-slate-600">Placement sessions, pending writing, and reporting overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/teacher/items" className="rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white">
            Item Bank Editor
          </Link>
          <Link
            href="/teacher/ai-settings"
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            AI Settings
          </Link>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Pending Writing Evaluations</h2>
        <div className="mt-3 space-y-2">
          {pendingWriting.length === 0 ? (
            <p className="text-sm text-slate-600">No pending writing submissions.</p>
          ) : (
            pendingWriting.map((submission) => (
              <div key={submission.id} className="rounded border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-800">
                  Session {submission.sessionId} · {submission.session.student.user.email}
                </p>
                <p className="mt-1 text-slate-600">
                  {submission.wordCount} words · submitted {submission.createdAt.toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Recent Reports</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {recentReports.length === 0 ? (
            <p className="text-sm text-slate-600">No reports yet.</p>
          ) : (
            recentReports.map((report) => (
              <Link
                key={report.id}
                href={`/results/${report.sessionId}`}
                className="rounded border border-slate-200 p-3 text-sm hover:border-teal-400"
              >
                <p className="font-medium text-slate-800">Session {report.sessionId}</p>
                <p className="mt-1 text-slate-600">
                  Overall {report.overallLevel} · Suggested {report.suggestedCourseLevel}
                </p>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
