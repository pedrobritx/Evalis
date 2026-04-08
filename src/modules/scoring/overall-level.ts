import type { SkillEstimateOutput, Skill } from "@/modules/types";
import {
  CEFR_ORDER,
  cefrToNumeric,
  numericToCefr,
  suffixForBand,
  withSuffix,
} from "@/modules/scoring/cefr-scale";

const BASE_WEIGHTS: Record<Skill, number> = {
  reading: 0.3,
  listening: 0.3,
  usee: 0.25,
  writing: 0.15,
};

function normalizedWeights(estimates: Partial<Record<Skill, SkillEstimateOutput>>) {
  const entries = Object.entries(estimates).filter(([, estimate]) => Boolean(estimate)) as Array<
    [Skill, SkillEstimateOutput]
  >;

  const total = entries.reduce((acc, [skill]) => acc + BASE_WEIGHTS[skill], 0);

  return entries.map(([skill, estimate]) => ({
    skill,
    estimate,
    weight: BASE_WEIGHTS[skill] / total,
  }));
}

function scoreFromEstimate(estimate: SkillEstimateOutput): number {
  const base = cefrToNumeric(estimate.cefr);
  if (estimate.suffix === "+") {
    return base + 0.33;
  }

  if (estimate.suffix === "-") {
    return base - 0.33;
  }

  return base;
}

function levelFromNumeric(numeric: number, confidence: number) {
  const bounded = Math.max(0, Math.min(5.99, numeric));
  const cefr = numericToCefr(bounded);
  const bandFloor = Math.floor(bounded);
  const progress = bounded - bandFloor;
  const suffix = suffixForBand(confidence, progress, confidence);

  return withSuffix(cefr, suffix);
}

function levelHalfStepDown(level: string): string {
  const suffix = level.endsWith("+") ? "+" : level.endsWith("-") ? "-" : "";
  const base = suffix ? level.slice(0, -1) : level;
  const index = CEFR_ORDER.indexOf(base as (typeof CEFR_ORDER)[number]);

  if (index <= 0) {
    return "A1-";
  }

  const downgraded = CEFR_ORDER[index - 1];
  return `${downgraded}+`;
}

export function computeOverallLevel(estimates: Partial<Record<Skill, SkillEstimateOutput>>) {
  const weighted = normalizedWeights(estimates);
  const isProvisional = !estimates.writing;

  const overallNumeric = weighted.reduce((acc, entry) => {
    return acc + scoreFromEstimate(entry.estimate) * entry.weight;
  }, 0);

  const aggregateConfidence = weighted.reduce((acc, entry) => {
    return acc + entry.estimate.confidence * entry.weight;
  }, 0);

  const overallLevel = levelFromNumeric(overallNumeric, aggregateConfidence);
  const suggestedCourseLevel =
    aggregateConfidence >= 0.85 ? overallLevel : levelHalfStepDown(overallLevel);

  return {
    overallNumeric,
    overallLevel,
    provisional: isProvisional,
    provisionalOverallLevel: isProvisional ? overallLevel : null,
    suggestedCourseLevel,
    confidence: aggregateConfidence,
  };
}
