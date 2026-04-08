import { SessionStatus, SkillAttemptStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { applyResponse, createAdaptiveSkillState } from "@/modules/assessment/adaptive-engine";
import { selectNextItem } from "@/modules/assessment/item-selector";
import { shouldStopSkillAttempt } from "@/modules/assessment/stop-rules";
import { buildReport } from "@/modules/reporting/report-builder";
import { estimateSkillLevel } from "@/modules/scoring/skill-estimator";
import type { DomainItem, Mode, Skill, SkillEstimateOutput } from "@/modules/types";
import {
  toDomainMode,
  toDomainSkill,
  toDomainWritingStatus,
  toPrismaMode,
  toPrismaSkill,
} from "@/modules/prisma-mappers";

const ALL_SKILLS: Skill[] = ["reading", "listening", "usee", "writing"];

function parseItemForEngine(item: {
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
}): DomainItem {
  return {
    id: item.id,
    skill: toDomainSkill(item.skill),
    subskill: item.subskill,
    level: item.level as DomainItem["level"],
    difficulty: item.difficulty,
    type: item.type,
    question: item.question,
    options: Array.isArray(item.options) ? (item.options as string[]) : undefined,
    answer: item.answer,
    explanation: item.explanation ?? undefined,
    active: item.active,
  };
}

export async function createSession(studentId: string, mode: Mode) {
  const session = await prisma.testSession.create({
    data: {
      studentId,
      mode: toPrismaMode(mode),
      skillAttempts: {
        create: ALL_SKILLS.map((skill) => ({
          skill: toPrismaSkill(skill),
          status: SkillAttemptStatus.NOT_STARTED,
        })),
      },
    },
  });

  return session;
}

export async function getSessionWithMode(sessionId: string) {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return null;
  }

  return {
    ...session,
    mode: toDomainMode(session.mode),
  };
}

export async function getResponsesForSkill(sessionId: string, skill: Skill) {
  return prisma.response.findMany({
    where: {
      sessionId,
      skill: toPrismaSkill(skill),
    },
    include: {
      item: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function buildAdaptiveState(sessionId: string, skill: Skill) {
  const responses = await getResponsesForSkill(sessionId, skill);
  const state = createAdaptiveSkillState();

  const next = responses.reduce((acc, response) => {
    return applyResponse(acc, parseItemForEngine(response.item), response.isCorrect);
  }, state);

  return {
    state: next,
    responses,
  };
}

export async function getNextItemForSkill(sessionId: string, skill: Skill) {
  const session = await getSessionWithMode(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  const { state, responses } = await buildAdaptiveState(sessionId, skill);

  const estimate = estimateSkillLevel({
    mode: session.mode,
    skill,
    theta: state.theta,
    history: state.answers,
  });

  if (
    shouldStopSkillAttempt({
      mode: session.mode,
      confidence: estimate.confidence,
      itemsAnswered: estimate.itemsAnswered,
    })
  ) {
    return {
      done: true,
      estimate,
      item: null,
    };
  }

  const items = await prisma.item.findMany({
    where: {
      skill: toPrismaSkill(skill),
      active: true,
    },
    orderBy: {
      difficulty: "asc",
    },
  });

  const selected = selectNextItem({
    items: items.map(parseItemForEngine),
    skill,
    theta: state.theta,
    usedItemIds: responses.map((response) => response.itemId),
    recentSubskills: responses.slice(-6).map((response) => response.item.subskill),
  });

  if (!selected) {
    return {
      done: true,
      estimate,
      item: null,
    };
  }

  await prisma.skillAttempt.update({
    where: {
      sessionId_skill: {
        sessionId,
        skill: toPrismaSkill(skill),
      },
    },
    data: {
      status: SkillAttemptStatus.IN_PROGRESS,
      startedAt: new Date(),
    },
  });

  const safeItem = {
    id: selected.id,
    skill: selected.skill,
    subskill: selected.subskill,
    level: selected.level,
    difficulty: selected.difficulty,
    type: selected.type,
    question: selected.question,
    options: selected.options,
    explanation: selected.explanation,
    active: selected.active,
  };

  return {
    done: false,
    estimate,
    item: safeItem,
  };
}

export async function upsertSkillEstimate(sessionId: string, estimate: SkillEstimateOutput) {
  return prisma.skillEstimate.upsert({
    where: {
      sessionId_skill: {
        sessionId,
        skill: toPrismaSkill(estimate.skill),
      },
    },
    update: {
      theta: estimate.theta,
      cefr: estimate.cefr,
      suffix: estimate.suffix,
      confidence: estimate.confidence,
      accuracy: estimate.accuracy,
      consistency: estimate.consistency,
      highestDifficulty: estimate.highestDifficulty,
      errorPatterns: estimate.errorPatterns,
      itemsAnswered: estimate.itemsAnswered,
    },
    create: {
      sessionId,
      skill: toPrismaSkill(estimate.skill),
      theta: estimate.theta,
      cefr: estimate.cefr,
      suffix: estimate.suffix,
      confidence: estimate.confidence,
      accuracy: estimate.accuracy,
      consistency: estimate.consistency,
      highestDifficulty: estimate.highestDifficulty,
      errorPatterns: estimate.errorPatterns,
      itemsAnswered: estimate.itemsAnswered,
    },
  });
}

export async function completeSkillAttemptIfNeeded(sessionId: string, skill: Skill, estimate: SkillEstimateOutput) {
  const session = await getSessionWithMode(sessionId);

  if (!session) {
    return;
  }

  const done = shouldStopSkillAttempt({
    mode: session.mode,
    confidence: estimate.confidence,
    itemsAnswered: estimate.itemsAnswered,
  });

  if (!done) {
    return;
  }

  await prisma.skillAttempt.update({
    where: {
      sessionId_skill: {
        sessionId,
        skill: toPrismaSkill(skill),
      },
    },
    data: {
      status: SkillAttemptStatus.COMPLETED,
      endedAt: new Date(),
    },
  });
}

export async function finalizeSession(sessionId: string) {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: {
      skillEstimates: true,
      writingSubmission: {
        include: {
          evaluation: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  const estimateMap: Partial<Record<Skill, SkillEstimateOutput>> = {};

  for (const skill of ALL_SKILLS) {
    const persisted = session.skillEstimates.find((estimate) => estimate.skill === toPrismaSkill(skill));

    if (persisted) {
      estimateMap[skill] = {
        skill,
        theta: persisted.theta,
        cefr: persisted.cefr as SkillEstimateOutput["cefr"],
        suffix: persisted.suffix as SkillEstimateOutput["suffix"],
        confidence: persisted.confidence,
        accuracy: persisted.accuracy,
        consistency: persisted.consistency,
        highestDifficulty: persisted.highestDifficulty,
        errorPatterns: persisted.errorPatterns as Record<string, number>,
        itemsAnswered: persisted.itemsAnswered,
        levelWithConfidence: `${persisted.cefr}${persisted.suffix}` as SkillEstimateOutput["levelWithConfidence"],
      };
      continue;
    }

    if (skill === "writing") {
      continue;
    }

    const { state } = await buildAdaptiveState(sessionId, skill);
    const estimate = estimateSkillLevel({
      skill,
      mode: toDomainMode(session.mode),
      theta: state.theta,
      history: state.answers,
    });

    estimateMap[skill] = estimate;
    await upsertSkillEstimate(sessionId, estimate);
  }

  if (session.writingSubmission?.evaluation) {
    const evaluation = session.writingSubmission.evaluation;
    estimateMap.writing = {
      skill: "writing",
      theta: 0,
      cefr: evaluation.cefr as SkillEstimateOutput["cefr"],
      suffix: evaluation.suffix as SkillEstimateOutput["suffix"],
      confidence: evaluation.suffix === "+" ? 0.9 : evaluation.suffix === "-" ? 0.55 : 0.75,
      accuracy: 0,
      consistency: 0,
      highestDifficulty: 0,
      errorPatterns: {},
      itemsAnswered: 1,
      levelWithConfidence: `${evaluation.cefr}${evaluation.suffix}` as SkillEstimateOutput["levelWithConfidence"],
    };
  }

  const writingStatus = session.writingSubmission
    ? toDomainWritingStatus(session.writingSubmission.status)
    : ("pending" as const);

  const report = buildReport({
    estimates: estimateMap,
    writingStatus,
  });

  await prisma.report.upsert({
    where: { sessionId },
    update: report,
    create: {
      sessionId,
      ...report,
    },
  });

  await prisma.testSession.update({
    where: { id: sessionId },
    data: {
      status: SessionStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  return report;
}

export async function getSessionReport(sessionId: string) {
  return prisma.report.findUnique({
    where: { sessionId },
  });
}

export async function getWritingStatus(sessionId: string) {
  const submission = await prisma.writingSubmission.findUnique({
    where: { sessionId },
  });

  if (!submission) {
    return "pending" as const;
  }

  return toDomainWritingStatus(submission.status);
}
