import { AiSettingsPanel } from "@/components/teacher/ai-settings-panel";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AiSettingsPage() {
  const user = await getSessionUser();
  const teacher = user ? await prisma.teacher.findUnique({ where: { userId: user.id } }) : null;

  const usage = teacher
    ? await prisma.usageQuota.findMany({
        where: {
          ownerType: "TEACHER",
          ownerId: teacher.id,
        },
        orderBy: {
          date: "desc",
        },
        take: 14,
      })
    : [];

  if (!teacher) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
        <h1 className="text-2xl font-bold text-slate-900">AI Settings & Usage Controls</h1>
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Sign in as a teacher account to manage AI settings.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <h1 className="text-2xl font-bold text-slate-900">AI Settings & Usage Controls</h1>
      <AiSettingsPanel
        initialProvider={(teacher.aiProvider ?? "OPENAI") as "OPENAI" | "OLLAMA" | "CUSTOM"}
        initialHasStoredKey={Boolean(teacher.aiKeyEncrypted)}
        initialUsage={usage.map((entry) => ({
          id: entry.id,
          date: entry.date.toISOString(),
          dailyUsed: entry.dailyUsed,
          dailyLimit: entry.dailyLimit,
          perStudentUsed: entry.perStudentUsed,
          perStudentLimit: entry.perStudentLimit,
        }))}
      />
    </main>
  );
}
