export type Skill = "reading" | "listening" | "usee" | "writing";
export type Mode = "short" | "full";
export type CEFR = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type ConfidenceSuffix = "+" | "" | "-";
export type LevelWithConfidence = `${CEFR}${ConfidenceSuffix}`;
export type WritingStatus = "pending" | "evaluating" | "completed" | "failed";

export interface DomainItem {
  id: string;
  skill: Skill;
  subskill: string;
  level: CEFR;
  difficulty: number;
  type: string;
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
  active: boolean;
}

export interface ResponseInput {
  itemId: string;
  skill: Skill;
  answer: string;
  latencyMs?: number;
}

export interface SkillMetrics {
  accuracy: number;
  consistency: number;
  highestDifficulty: number;
  errorPatterns: Record<string, number>;
  itemsAnswered: number;
}

export interface SkillEstimateOutput extends SkillMetrics {
  skill: Skill;
  theta: number;
  cefr: CEFR;
  suffix: ConfidenceSuffix;
  confidence: number;
  levelWithConfidence: LevelWithConfidence;
}

export interface SkillAnswerRecord {
  isCorrect: boolean;
  difficulty: number;
  subskill: string;
  type: string;
  thetaBefore: number;
  thetaAfter: number;
}

export interface WritingEvaluationResult {
  task: number;
  coherence: number;
  lexical: number;
  grammar: number;
  cefr: LevelWithConfidence;
  feedback: string;
}
