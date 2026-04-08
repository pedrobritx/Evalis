import type { DomainItem, Mode, Skill, SkillAnswerRecord } from "@/modules/types";
import { estimateSkillLevel } from "@/modules/scoring/skill-estimator";

export interface AdaptiveSkillState {
  theta: number;
  answers: SkillAnswerRecord[];
  directionChanges: number;
  lastDirection: 1 | -1 | null;
}

const BASELINE_THETA = -0.5;

function clampTheta(theta: number): number {
  return Math.max(-3, Math.min(3, theta));
}

export function createAdaptiveSkillState(initialTheta = BASELINE_THETA): AdaptiveSkillState {
  return {
    theta: initialTheta,
    answers: [],
    directionChanges: 0,
    lastDirection: null,
  };
}

export function rebuildStateFromHistory(
  history: Array<{
    isCorrect: boolean;
    difficulty: number;
    subskill: string;
    type: string;
  }>,
  initialTheta = BASELINE_THETA,
): AdaptiveSkillState {
  return history.reduce<AdaptiveSkillState>((state, item) => {
    return applyResponse(state, {
      id: "history",
      skill: "reading",
      level: "B1",
      active: true,
      question: "",
      answer: "",
      explanation: "",
      options: [],
      ...item,
    } as DomainItem,
    item.isCorrect);
  }, createAdaptiveSkillState(initialTheta));
}

export function applyResponse(
  current: AdaptiveSkillState,
  item: DomainItem,
  isCorrect: boolean,
): AdaptiveSkillState {
  const direction: 1 | -1 = isCorrect ? 1 : -1;
  const changedDirection = current.lastDirection !== null && current.lastDirection !== direction;
  const directionChanges = current.directionChanges + (changedDirection ? 1 : 0);
  const step = directionChanges >= 2 ? 0.2 : 0.35;

  const thetaBefore = current.theta;
  const thetaAfter = clampTheta(current.theta + direction * step);

  const answer: SkillAnswerRecord = {
    isCorrect,
    difficulty: item.difficulty,
    subskill: item.subskill,
    type: item.type,
    thetaBefore,
    thetaAfter,
  };

  return {
    theta: thetaAfter,
    answers: [...current.answers, answer],
    directionChanges,
    lastDirection: direction,
  };
}

export function estimateFromAdaptiveState(params: {
  skill: Skill;
  mode: Mode;
  state: AdaptiveSkillState;
}) {
  return estimateSkillLevel({
    skill: params.skill,
    mode: params.mode,
    theta: params.state.theta,
    history: params.state.answers,
  });
}
