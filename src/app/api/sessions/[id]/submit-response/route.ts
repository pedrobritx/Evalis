import { SkillAttemptStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { parseJsonBody, toErrorResponse } from "@/lib/validation";
import { checkAnswer, wordCount } from "@/modules/assessment/answer-checker";
import {
  buildAdaptiveState,
  completeSkillAttemptIfNeeded,
  getSessionWithMode,
  upsertSkillEstimate,
} from "@/modules/assessment/session-service";
import { estimateSkillLevel } from "@/modules/scoring/skill-estimator";
import { toDomainSkill, toPrismaSkill } from "@/modules/prisma-mappers";

const bodySchema = z.object({
  skill: z.enum(["reading", "listening", "usee", "writing"]),
  itemId: z.string().min(1),
  answer: z.string().min(1),
  latencyMs: z.number().int().nonnegative().optional(),
});

function parseItem(item: {
  id: string;
  question: string;
  answer: string;
  explanation: string | null;
  options: unknown;
  type: string;
  subskill: string;
  level: string;
  difficulty: number;
  active: boolean;
  skill: Parameters<typeof toDomainSkill>[0];
}) {
  return {
    id: item.id,
    skill: toDomainSkill(item.skill),
    subskill: item.subskill,
    level: item.level as "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
    difficulty: item.difficulty,
    type: item.type,
    question: item.question,
    options: Array.isArray(item.options) ? (item.options as string[]) : undefined,
    answer: item.answer,
    explanation: item.explanation ?? undefined,
    active: item.active,
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const parsedBody = await parseJsonBody(request, bodySchema);

  if ("error" in parsedBody) {
    return toErrorResponse(parsedBody.error, 400, parsedBody.details);
  }

  const { answer, itemId, skill, latencyMs } = parsedBody.data;

  const session = await getSessionWithMode(id);

  if (!session) {
    return toErrorResponse("Session not found", 404);
  }

  const item = await prisma.item.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    return toErrorResponse("Item not found", 404);
  }

  if (item.skill !== toPrismaSkill(skill)) {
    return toErrorResponse("Item does not belong to selected skill", 400);
  }

  const domainItem = parseItem(item);
  const isCorrect = checkAnswer(domainItem, answer);

  await prisma.response.create({
    data: {
      sessionId: id,
      itemId,
      skill: toPrismaSkill(skill),
      isCorrect,
      responsePayload: {
        answer,
      },
      latencyMs,
    },
  });

  if (skill === "writing") {
    await prisma.writingSubmission.upsert({
      where: { sessionId: id },
      update: {
        prompt: domainItem.question,
        text: answer,
        wordCount: wordCount(answer),
      },
      create: {
        sessionId: id,
        prompt: domainItem.question,
        text: answer,
        wordCount: wordCount(answer),
      },
    });

    await prisma.skillAttempt.update({
      where: {
        sessionId_skill: {
          sessionId: id,
          skill: toPrismaSkill("writing"),
        },
      },
      data: {
        status: SkillAttemptStatus.COMPLETED,
        endedAt: new Date(),
      },
    });
  }

  const { state } = await buildAdaptiveState(id, skill);
  const estimate = estimateSkillLevel({
    skill,
    mode: session.mode,
    theta: state.theta,
    history: state.answers,
  });

  await upsertSkillEstimate(id, estimate);

  if (skill !== "writing") {
    await completeSkillAttemptIfNeeded(id, skill, estimate);
  }

  return Response.json({
    accepted: true,
    isCorrect,
    estimate,
  });
}
