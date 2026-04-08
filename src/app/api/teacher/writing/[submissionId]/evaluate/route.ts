import { KeySource, ProviderType, Role } from "@prisma/client";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { parseJsonBody, toErrorResponse } from "@/lib/validation";
import { evaluateWritingSubmission } from "@/modules/writing/evaluation-service";
import { prisma } from "@/lib/prisma";
import { finalizeSession } from "@/modules/assessment/session-service";

const bodySchema = z.object({
  provider: z.enum(["OPENAI", "OLLAMA", "CUSTOM"]).default("OPENAI"),
  keySource: z.enum(["TEACHER", "STUDENT", "LOCAL"]).default("TEACHER"),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  endpoint: z.string().url().optional(),
  studentOwnerId: z.string().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ submissionId: string }> },
) {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  if (!user) {
    return toErrorResponse("Unauthorized", 401);
  }

  const { submissionId } = await context.params;
  const parsed = await parseJsonBody(request, bodySchema);

  if ("error" in parsed) {
    return toErrorResponse(parsed.error, 400, parsed.details);
  }

  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });

  if (!teacher) {
    return toErrorResponse("Teacher account not found", 404);
  }

  const submission = await prisma.writingSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    return toErrorResponse("Writing submission not found", 404);
  }

  try {
    const evaluation = await evaluateWritingSubmission({
      submissionId,
      actorId: user.id,
      provider: parsed.data.provider as ProviderType,
      keySource: parsed.data.keySource as KeySource,
      apiKey: parsed.data.apiKey,
      model: parsed.data.model,
      endpoint: parsed.data.endpoint,
      teacherOwnerId: teacher.id,
      studentOwnerId: parsed.data.studentOwnerId,
    });

    const report = await finalizeSession(submission.sessionId);

    return Response.json({
      evaluation,
      report,
    });
  } catch (error) {
    return toErrorResponse(
      error instanceof Error ? error.message : "Writing evaluation failed",
      400,
    );
  }
}
