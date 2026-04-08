import { z } from "zod";

import type { CEFR, ConfidenceSuffix, LevelWithConfidence } from "@/modules/types";

export const rubricScoreSchema = z.object({
  task: z.number().min(0).max(5),
  coherence: z.number().min(0).max(5),
  lexical: z.number().min(0).max(5),
  grammar: z.number().min(0).max(5),
});

export type RubricScore = z.infer<typeof rubricScoreSchema>;

function totalToCefr(total: number): CEFR {
  if (total <= 4) {
    return "A1";
  }

  if (total <= 7) {
    return "A2";
  }

  if (total <= 11) {
    return "B1";
  }

  if (total <= 15) {
    return "B2";
  }

  if (total <= 18) {
    return "C1";
  }

  return "C2";
}

function computeSuffix(score: RubricScore): ConfidenceSuffix {
  const values = Object.values(score);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const variance = values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
  const stdev = Math.sqrt(variance);

  if (min >= 4 && max >= 4 && stdev < 0.8) {
    return "+";
  }

  if (min <= 1 || stdev > 1.2) {
    return "-";
  }

  return "";
}

export function mapRubricToLevel(score: RubricScore): {
  total: number;
  cefr: CEFR;
  suffix: ConfidenceSuffix;
  levelWithConfidence: LevelWithConfidence;
} {
  const total = score.task + score.coherence + score.lexical + score.grammar;
  const cefr = totalToCefr(total);
  const suffix = computeSuffix(score);

  return {
    total,
    cefr,
    suffix,
    levelWithConfidence: `${cefr}${suffix}`,
  };
}
