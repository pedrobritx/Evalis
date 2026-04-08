import { describe, expect, it } from "vitest";

import { applyResponse, createAdaptiveSkillState } from "@/modules/assessment/adaptive-engine";
import { shouldStopSkillAttempt } from "@/modules/assessment/stop-rules";
import { buildReport } from "@/modules/reporting/report-builder";

describe("Adaptive progression", () => {
  const baseItem = {
    id: "read_b1_001",
    skill: "reading" as const,
    subskill: "inference",
    level: "B1" as const,
    difficulty: 0,
    type: "multiple_choice",
    question: "Sample question",
    options: ["A", "B", "C"],
    answer: "B",
    active: true,
  };

  it("moves theta up when correct and down when wrong", () => {
    const start = createAdaptiveSkillState();
    const afterCorrect = applyResponse(start, baseItem, true);
    const afterWrong = applyResponse(afterCorrect, baseItem, false);

    expect(afterCorrect.theta).toBeGreaterThan(start.theta);
    expect(afterWrong.theta).toBeLessThan(afterCorrect.theta);
  });
});

describe("Stop rules", () => {
  it("stops short mode on confidence threshold after min items", () => {
    expect(
      shouldStopSkillAttempt({
        mode: "short",
        itemsAnswered: 6,
        confidence: 0.71,
      }),
    ).toBe(true);
  });

  it("does not stop below min item count", () => {
    expect(
      shouldStopSkillAttempt({
        mode: "full",
        itemsAnswered: 7,
        confidence: 0.99,
      }),
    ).toBe(false);
  });
});

describe("Reporting when writing pending", () => {
  it("produces provisional overall without writing estimate", () => {
    const report = buildReport({
      estimates: {
        reading: {
          skill: "reading",
          theta: 0.3,
          cefr: "B2",
          suffix: "+",
          confidence: 0.9,
          accuracy: 0.82,
          consistency: 0.81,
          highestDifficulty: 0.7,
          errorPatterns: {},
          itemsAnswered: 10,
          levelWithConfidence: "B2+",
        },
        listening: {
          skill: "listening",
          theta: -0.4,
          cefr: "B1",
          suffix: "",
          confidence: 0.7,
          accuracy: 0.67,
          consistency: 0.7,
          highestDifficulty: 0.2,
          errorPatterns: {},
          itemsAnswered: 10,
          levelWithConfidence: "B1",
        },
        usee: {
          skill: "usee",
          theta: 0.2,
          cefr: "B2",
          suffix: "",
          confidence: 0.72,
          accuracy: 0.7,
          consistency: 0.7,
          highestDifficulty: 0.5,
          errorPatterns: {},
          itemsAnswered: 10,
          levelWithConfidence: "B2",
        },
      },
      writingStatus: "pending",
    });

    expect(report.provisionalOverallLevel).toBeTruthy();
    expect(report.perSkill.writing.level).toBe("Pending");
  });
});
