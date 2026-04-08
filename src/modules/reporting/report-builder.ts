import type { Skill, SkillEstimateOutput, WritingStatus } from "@/modules/types";
import { computeOverallLevel } from "@/modules/scoring/overall-level";
import { buildSkillFeedback } from "@/modules/reporting/feedback-templates";

export interface ReportBuildInput {
  estimates: Partial<Record<Skill, SkillEstimateOutput>>;
  writingStatus: WritingStatus;
}

const SKILL_ORDER: Skill[] = ["reading", "listening", "usee", "writing"];

function toRadarValue(estimate?: SkillEstimateOutput): number {
  if (!estimate) {
    return 0;
  }

  const base =
    estimate.cefr === "A1"
      ? 1
      : estimate.cefr === "A2"
        ? 2
        : estimate.cefr === "B1"
          ? 3
          : estimate.cefr === "B2"
            ? 4
            : estimate.cefr === "C1"
              ? 5
              : 6;

  if (estimate.suffix === "+") {
    return base + 0.33;
  }

  if (estimate.suffix === "-") {
    return base - 0.33;
  }

  return base;
}

export function buildReport({ estimates, writingStatus }: ReportBuildInput) {
  const forOverall =
    writingStatus === "completed"
      ? estimates
      : { ...estimates, writing: undefined };

  const overall = computeOverallLevel(forOverall);

  const perSkill = SKILL_ORDER.reduce<Record<
    Skill,
    { level: string; confidence: number | null; status: "done" | "pending" }
  >>((acc, skill) => {
    const estimate = estimates[skill];

    if (skill === "writing" && writingStatus !== "completed") {
      acc[skill] = {
        level: "Pending",
        confidence: null,
        status: "pending",
      };
      return acc;
    }

    acc[skill] = {
      level: estimate?.levelWithConfidence ?? "Pending",
      confidence: estimate?.confidence ?? null,
      status: estimate ? "done" : "pending",
    };

    return acc;
  }, {} as Record<Skill, { level: string; confidence: number | null; status: "done" | "pending" }>);

  const radarData = SKILL_ORDER.map((skill) => ({
    skill,
    value: skill === "writing" && writingStatus !== "completed" ? 0 : toRadarValue(estimates[skill]),
  }));

  const confidenceData = SKILL_ORDER.map((skill) => ({
    skill,
    confidence: perSkill[skill].confidence,
    status: perSkill[skill].status,
  }));

  const feedback = SKILL_ORDER.reduce<Record<Skill, string>>((acc, skill) => {
    acc[skill] = buildSkillFeedback(skill, estimates[skill]);
    return acc;
  }, {} as Record<Skill, string>);

  return {
    perSkill,
    overallLevel: overall.overallLevel,
    overallNumeric: overall.overallNumeric,
    provisionalOverallLevel: overall.provisional ? overall.overallLevel : null,
    suggestedCourseLevel: overall.suggestedCourseLevel,
    radarData,
    confidenceData,
    feedback,
  };
}
