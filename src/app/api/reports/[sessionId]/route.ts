import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;

  const report = await prisma.report.findUnique({
    where: { sessionId },
  });

  const writing = await prisma.writingSubmission.findUnique({
    where: { sessionId },
    include: { evaluation: true },
  });

  if (!report) {
    return Response.json({ error: "Report not found" }, { status: 404 });
  }

  return Response.json({
    report,
    writingStatus: writing?.status ?? "PENDING",
  });
}
