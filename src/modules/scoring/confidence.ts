import type { Mode } from "@/modules/types";
import { clamp } from "@/modules/scoring/cefr-scale";
import { getModeProfile } from "@/modules/assessment/stop-rules";

export interface ConfidenceInputs {
  mode: Mode;
  itemsAnswered: number;
  consistency: number;
  highestDifficulty: number;
}

export interface ConfidenceBreakdown {
  confidence: number;
  sampleAdequacy: number;
  difficultyEvidence: number;
  consistency: number;
}

export function calculateConfidence({
  mode,
  itemsAnswered,
  consistency,
  highestDifficulty,
}: ConfidenceInputs): ConfidenceBreakdown {
  const profile = getModeProfile(mode);
  const sampleAdequacy = clamp(
    (itemsAnswered - profile.minItems + 1) / (profile.maxItems - profile.minItems + 1),
  );

  const difficultyEvidence = clamp((highestDifficulty + 2.5) / 5);
  const normalizedConsistency = clamp(consistency);

  const confidence = clamp(
    0.4 * sampleAdequacy + 0.3 * normalizedConsistency + 0.3 * difficultyEvidence,
  );

  return {
    confidence,
    sampleAdequacy,
    consistency: normalizedConsistency,
    difficultyEvidence,
  };
}
