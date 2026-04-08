import type { Mode } from "@/modules/types";

export interface ModeProfile {
  mode: Mode;
  minItems: number;
  maxItems: number;
  confidenceTarget: number;
}

const MODE_PROFILES: Record<Mode, ModeProfile> = {
  short: {
    mode: "short",
    minItems: 6,
    maxItems: 10,
    confidenceTarget: 0.7,
  },
  full: {
    mode: "full",
    minItems: 10,
    maxItems: 16,
    confidenceTarget: 0.82,
  },
};

export function getModeProfile(mode: Mode): ModeProfile {
  return MODE_PROFILES[mode];
}

export function shouldStopSkillAttempt(params: {
  mode: Mode;
  itemsAnswered: number;
  confidence: number;
}): boolean {
  const profile = getModeProfile(params.mode);

  if (params.itemsAnswered >= profile.maxItems) {
    return true;
  }

  return params.itemsAnswered >= profile.minItems && params.confidence >= profile.confidenceTarget;
}
