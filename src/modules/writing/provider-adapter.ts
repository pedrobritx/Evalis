import { z } from "zod";

import type { WritingEvaluationResult } from "@/modules/types";

export interface ProviderConfig {
  apiKey?: string;
  model?: string;
  endpoint?: string;
}

export interface WritingProviderAdapter {
  provider: "openai" | "ollama" | "custom";
  evaluate(prompt: string, text: string, config: ProviderConfig): Promise<WritingEvaluationResult>;
}

export const writingEvaluationSchema = z.object({
  task: z.number().min(0).max(5),
  coherence: z.number().min(0).max(5),
  lexical: z.number().min(0).max(5),
  grammar: z.number().min(0).max(5),
  cefr: z.enum([
    "A1-",
    "A1",
    "A1+",
    "A2-",
    "A2",
    "A2+",
    "B1-",
    "B1",
    "B1+",
    "B2-",
    "B2",
    "B2+",
    "C1-",
    "C1",
    "C1+",
    "C2-",
    "C2",
    "C2+",
  ]),
  feedback: z.string().min(8),
});

export const WRITING_EVALUATOR_PROMPT = `You are a CEFR writing examiner.

Evaluate the text using:
- Task Achievement (0-5)
- Coherence & Cohesion (0-5)
- Lexical Resource (0-5)
- Grammatical Range & Accuracy (0-5)

Then:
- Map the result to a CEFR level from A1 to C2
- Add + or - based on performance consistency
- Return JSON only in this format:

{
  "task": number,
  "coherence": number,
  "lexical": number,
  "grammar": number,
  "cefr": "B1+",
  "feedback": "short paragraph"
}`;

export function parseWritingEvaluation(raw: unknown): WritingEvaluationResult {
  if (typeof raw === "string") {
    return writingEvaluationSchema.parse(JSON.parse(raw));
  }

  return writingEvaluationSchema.parse(raw);
}
