import type {
  Skill,
  SkillAnswerRecord,
  SkillEstimateOutput,
  SkillMetrics,
} from "@/modules/types";
import type { Mode } from "@/modules/types";
import {
  bandPosition,
  suffixForBand,
  thetaToCefr,
  withSuffix,
} from "@/modules/scoring/cefr-scale";
import { calculateConfidence } from "@/modules/scoring/confidence";

export function computeConsistency(history: SkillAnswerRecord[]): number {
  if (history.length <= 1) {
    return 0.5;
  }

  const window = history.slice(-5);
  const values: number[] = window.map((entry) => (entry.isCorrect ? 1 : 0));
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const variance =
    values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;

  const thetaVolatility =
    window.slice(1).reduce((acc, entry, index) => {
      return acc + Math.abs(entry.thetaAfter - window[index].thetaAfter);
    }, 0) / Math.max(1, window.length - 1);

  const varianceStability = Math.max(0, Math.min(1, 1 - variance * 4));
  const volatilityPenalty = Math.max(0, Math.min(1, 1 - thetaVolatility / 0.8));

  return Math.max(0, Math.min(1, varianceStability * 0.7 + volatilityPenalty * 0.3));
}

export function computeMetrics(history: SkillAnswerRecord[]): SkillMetrics {
  const itemsAnswered = history.length;

  if (itemsAnswered === 0) {
    return {
      accuracy: 0,
      consistency: 0,
      highestDifficulty: -0.5,
      errorPatterns: {},
      itemsAnswered: 0,
    };
  }

  const correctCount = history.filter((entry) => entry.isCorrect).length;
  const accuracy = correctCount / itemsAnswered;
  const consistency = computeConsistency(history);
  const highestDifficulty = Math.max(...history.map((entry) => entry.difficulty));

  const errorPatterns = history.reduce<Record<string, number>>((acc, entry) => {
    if (!entry.isCorrect) {
      const key = `${entry.subskill}:${entry.type}`;
      acc[key] = (acc[key] ?? 0) + 1;
    }

    return acc;
  }, {});

  return {
    accuracy,
    consistency,
    highestDifficulty,
    errorPatterns,
    itemsAnswered,
  };
}

export function estimateSkillLevel(params: {
  skill: Skill;
  mode: Mode;
  theta: number;
  history: SkillAnswerRecord[];
}): SkillEstimateOutput {
  const metrics = computeMetrics(params.history);
  const cefr = thetaToCefr(params.theta);
  const confidenceBreakdown = calculateConfidence({
    mode: params.mode,
    itemsAnswered: metrics.itemsAnswered,
    consistency: metrics.consistency,
    highestDifficulty: metrics.highestDifficulty,
  });

  const suffix = suffixForBand(
    confidenceBreakdown.confidence,
    bandPosition(params.theta, cefr),
    metrics.consistency,
  );

  return {
    ...metrics,
    skill: params.skill,
    theta: params.theta,
    cefr,
    suffix,
    confidence: confidenceBreakdown.confidence,
    levelWithConfidence: withSuffix(cefr, suffix),
  };
}
