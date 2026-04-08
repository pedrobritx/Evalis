import { describe, expect, it } from "vitest";

import { thetaToCefr, suffixForBand } from "@/modules/scoring/cefr-scale";
import { calculateConfidence } from "@/modules/scoring/confidence";
import { computeOverallLevel } from "@/modules/scoring/overall-level";
import { mapRubricToLevel } from "@/modules/writing/rubric";

describe("CEFR mapping", () => {
  it("maps theta to correct CEFR bands", () => {
    expect(thetaToCefr(-2.3)).toBe("A1");
    expect(thetaToCefr(-1.4)).toBe("A2");
    expect(thetaToCefr(-0.4)).toBe("B1");
    expect(thetaToCefr(0.4)).toBe("B2");
    expect(thetaToCefr(1.3)).toBe("C1");
    expect(thetaToCefr(2.2)).toBe("C2");
  });

  it("assigns suffixes by confidence + consistency", () => {
    expect(suffixForBand(0.9, 0.7, 0.8)).toBe("+");
    expect(suffixForBand(0.72, 0.4, 0.8)).toBe("");
    expect(suffixForBand(0.5, 0.9, 0.3)).toBe("-");
  });
});

describe("Confidence score", () => {
  it("calculates weighted confidence in [0,1]", () => {
    const result = calculateConfidence({
      mode: "full",
      itemsAnswered: 12,
      consistency: 0.8,
      highestDifficulty: 1.1,
    });

    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});

describe("Overall level", () => {
  it("renormalizes weights when writing is pending", () => {
    const overall = computeOverallLevel({
      reading: {
        skill: "reading",
        theta: 0.2,
        cefr: "B2",
        suffix: "+",
        confidence: 0.9,
        accuracy: 0.8,
        consistency: 0.8,
        highestDifficulty: 0.6,
        errorPatterns: {},
        itemsAnswered: 10,
        levelWithConfidence: "B2+",
      },
      listening: {
        skill: "listening",
        theta: -0.1,
        cefr: "B1",
        suffix: "",
        confidence: 0.75,
        accuracy: 0.72,
        consistency: 0.7,
        highestDifficulty: 0.2,
        errorPatterns: {},
        itemsAnswered: 10,
        levelWithConfidence: "B1",
      },
      usee: {
        skill: "usee",
        theta: 0.5,
        cefr: "B2",
        suffix: "",
        confidence: 0.8,
        accuracy: 0.74,
        consistency: 0.71,
        highestDifficulty: 0.8,
        errorPatterns: {},
        itemsAnswered: 10,
        levelWithConfidence: "B2",
      },
    });

    expect(overall.provisional).toBe(true);
    expect(overall.provisionalOverallLevel).toBeTruthy();
  });
});

describe("Writing rubric mapping", () => {
  it("maps rubric totals to CEFR", () => {
    const level = mapRubricToLevel({
      task: 4,
      coherence: 4,
      lexical: 3,
      grammar: 3,
    });

    expect(level.total).toBe(14);
    expect(level.cefr).toBe("B2");
  });
});
