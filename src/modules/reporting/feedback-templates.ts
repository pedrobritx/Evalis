import type { Skill, SkillEstimateOutput } from "@/modules/types";

const SKILL_LABELS: Record<Skill, string> = {
  reading: "Reading",
  listening: "Listening",
  usee: "Use of English",
  writing: "Writing",
};

export function buildSkillFeedback(skill: Skill, estimate?: SkillEstimateOutput): string {
  if (!estimate) {
    return `${SKILL_LABELS[skill]} is pending.`;
  }

  const strengths = estimate.accuracy >= 0.7 ? "solid control" : "developing control";
  const stability =
    estimate.consistency >= 0.7
      ? "with stable performance"
      : "with some performance fluctuation";

  const errorThemes = Object.entries(estimate.errorPatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => key.replace(":", " / "));

  if (errorThemes.length === 0) {
    return `${SKILL_LABELS[skill]} sits at ${estimate.levelWithConfidence}, showing ${strengths} ${stability}.`;
  }

  return `${SKILL_LABELS[skill]} sits at ${estimate.levelWithConfidence}, showing ${strengths} ${stability}. Focus next on ${errorThemes.join(
    " and ",
  )}.`;
}
