import type { CEFR, ConfidenceSuffix, LevelWithConfidence } from "@/modules/types";

export const CEFR_ORDER: CEFR[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const CEFR_BANDS: Record<CEFR, { min: number; max: number }> = {
  A1: { min: Number.NEGATIVE_INFINITY, max: -2.0 },
  A2: { min: -2.0, max: -1.0 },
  B1: { min: -1.0, max: 0.0 },
  B2: { min: 0.0, max: 1.0 },
  C1: { min: 1.0, max: 2.0 },
  C2: { min: 2.0, max: Number.POSITIVE_INFINITY },
};

const CEFR_TO_NUMERIC: Record<CEFR, number> = {
  A1: 0,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 5,
};

export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function thetaToCefr(theta: number): CEFR {
  if (theta < -2.0) {
    return "A1";
  }

  if (theta < -1.0) {
    return "A2";
  }

  if (theta < 0.0) {
    return "B1";
  }

  if (theta < 1.0) {
    return "B2";
  }

  if (theta < 2.0) {
    return "C1";
  }

  return "C2";
}

export function bandPosition(theta: number, cefr: CEFR): number {
  const band = CEFR_BANDS[cefr];

  if (!Number.isFinite(band.min) && Number.isFinite(band.max)) {
    return clamp((theta - (band.max - 1.0)) / 1.0);
  }

  if (Number.isFinite(band.min) && !Number.isFinite(band.max)) {
    return clamp(theta - band.min);
  }

  const width = band.max - band.min;
  return clamp((theta - band.min) / width);
}

export function cefrToNumeric(cefr: CEFR): number {
  return CEFR_TO_NUMERIC[cefr];
}

export function levelToNumeric(level: LevelWithConfidence): number {
  const suffix = level.endsWith("+") ? "+" : level.endsWith("-") ? "-" : "";
  const base = suffix ? (level.slice(0, -1) as CEFR) : (level as CEFR);
  const baseValue = cefrToNumeric(base);

  if (suffix === "+") {
    return baseValue + 0.33;
  }

  if (suffix === "-") {
    return baseValue - 0.33;
  }

  return baseValue;
}

export function numericToCefr(value: number): CEFR {
  const rounded = Math.max(0, Math.min(5, value));
  return CEFR_ORDER[Math.floor(rounded)];
}

export function suffixForBand(
  confidence: number,
  bandProgress: number,
  consistency: number,
): ConfidenceSuffix {
  if (confidence >= 0.85 && bandProgress >= 0.5 && consistency >= 0.6) {
    return "+";
  }

  if (confidence < 0.65 || consistency < 0.45) {
    return "-";
  }

  return "";
}

export function withSuffix(cefr: CEFR, suffix: ConfidenceSuffix): LevelWithConfidence {
  return `${cefr}${suffix}`;
}
