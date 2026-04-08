import { KeySource, OwnerType, Prisma, ProviderType, WritingStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import { mapRubricToLevel } from "@/modules/writing/rubric";
import type { ProviderConfig } from "@/modules/writing/provider-adapter";
import { openAiWritingProvider } from "@/modules/writing/providers/openai";
import { ollamaWritingProvider } from "@/modules/writing/providers/ollama";
import {
  checkQuota,
  consumeQuota,
  DEFAULT_STUDENT_LIMITS,
  DEFAULT_TEACHER_LIMITS,
} from "@/modules/usage/quota-service";
import { writeAuditLog } from "@/modules/usage/audit-service";

export interface EvaluateWritingInput {
  submissionId: string;
  actorId?: string;
  provider: ProviderType;
  keySource: KeySource;
  apiKey?: string;
  model?: string;
  endpoint?: string;
  studentOwnerId?: string;
  teacherOwnerId?: string;
}

function resolveProvider(provider: ProviderType) {
  if (provider === ProviderType.OLLAMA) {
    return ollamaWritingProvider;
  }

  return openAiWritingProvider;
}

async function resolveApiKey(input: EvaluateWritingInput): Promise<string | undefined> {
  if (input.keySource === KeySource.LOCAL) {
    return undefined;
  }

  if (input.apiKey) {
    return input.apiKey;
  }

  if (input.keySource === KeySource.TEACHER && input.teacherOwnerId) {
    const teacher = await prisma.teacher.findUnique({ where: { id: input.teacherOwnerId } });
    if (teacher?.aiKeyEncrypted) {
      return decryptSecret(teacher.aiKeyEncrypted);
    }
  }

  return undefined;
}

export async function evaluateWritingSubmission(input: EvaluateWritingInput) {
  const submission = await prisma.writingSubmission.findUnique({
    where: { id: input.submissionId },
    include: {
      session: true,
    },
  });

  if (!submission) {
    throw new Error("Writing submission not found");
  }

  const quotaOwnerType =
    input.keySource === KeySource.STUDENT ? OwnerType.STUDENT : OwnerType.TEACHER;
  const quotaOwnerId =
    quotaOwnerType === OwnerType.STUDENT ? input.studentOwnerId : input.teacherOwnerId;

  if (!quotaOwnerId) {
    throw new Error("Missing quota owner for writing evaluation");
  }

  const limits =
    quotaOwnerType === OwnerType.STUDENT ? DEFAULT_STUDENT_LIMITS : DEFAULT_TEACHER_LIMITS;

  const quotaCheck = await checkQuota({
    ownerType: quotaOwnerType,
    ownerId: quotaOwnerId,
    ...limits,
  });

  if (!quotaCheck.allowed) {
    await writeAuditLog({
      actorId: input.actorId,
      action: "writing_evaluation",
      targetType: "WritingSubmission",
      targetId: submission.id,
      provider: input.provider,
      status: "blocked",
      metadata: { reason: quotaCheck.reason },
    });

    throw new Error(quotaCheck.reason ?? "Usage limit reached");
  }

  await prisma.writingSubmission.update({
    where: { id: submission.id },
    data: { status: WritingStatus.EVALUATING },
  });

  const adapter = resolveProvider(input.provider);
  const apiKey = await resolveApiKey(input);

  const config: ProviderConfig = {
    apiKey,
    model: input.model,
    endpoint: input.endpoint,
  };

  try {
    const evaluated = await adapter.evaluate(submission.prompt, submission.text, config);

    const rubricLevel = mapRubricToLevel({
      task: evaluated.task,
      coherence: evaluated.coherence,
      lexical: evaluated.lexical,
      grammar: evaluated.grammar,
    });

    const [cefr, suffix = ""] = [evaluated.cefr.slice(0, 2), evaluated.cefr.slice(2)];

    const finalCefr = cefr || rubricLevel.cefr;
    const finalSuffix = suffix || rubricLevel.suffix;

    const record = await prisma.writingEvaluation.upsert({
      where: { submissionId: submission.id },
      update: {
        task: evaluated.task,
        coherence: evaluated.coherence,
        lexical: evaluated.lexical,
        grammar: evaluated.grammar,
        cefr: finalCefr,
        suffix: finalSuffix,
        feedback: evaluated.feedback,
        provider: input.provider,
        keySource: input.keySource,
        rawJson: evaluated as unknown as Prisma.InputJsonValue,
      },
      create: {
        submissionId: submission.id,
        task: evaluated.task,
        coherence: evaluated.coherence,
        lexical: evaluated.lexical,
        grammar: evaluated.grammar,
        cefr: finalCefr,
        suffix: finalSuffix,
        feedback: evaluated.feedback,
        provider: input.provider,
        keySource: input.keySource,
        rawJson: evaluated as unknown as Prisma.InputJsonValue,
      },
    });

    await prisma.writingSubmission.update({
      where: { id: submission.id },
      data: { status: WritingStatus.COMPLETED },
    });

    await consumeQuota({
      ownerType: quotaOwnerType,
      ownerId: quotaOwnerId,
      ...limits,
    });

    await writeAuditLog({
      actorId: input.actorId,
      action: "writing_evaluation",
      targetType: "WritingSubmission",
      targetId: submission.id,
      provider: input.provider,
      status: "success",
      metadata: {
        rubricLevel,
        provider: adapter.provider,
      },
    });

    return record;
  } catch (error) {
    await prisma.writingSubmission.update({
      where: { id: submission.id },
      data: { status: WritingStatus.FAILED },
    });

    await writeAuditLog({
      actorId: input.actorId,
      action: "writing_evaluation",
      targetType: "WritingSubmission",
      targetId: submission.id,
      provider: input.provider,
      status: "failed",
      metadata: {
        error: error instanceof Error ? error.message : "Unknown evaluation error",
      },
    });

    throw error;
  }
}
