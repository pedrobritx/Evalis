import type { DomainItem } from "@/modules/types";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function checkAnswer(item: DomainItem, submitted: string): boolean {
  if (item.skill === "writing") {
    // Writing is rubric-evaluated later; this only validates minimum task length.
    return submitted.trim().split(/\s+/).filter(Boolean).length >= 50;
  }

  const expected = normalize(item.answer);
  const actual = normalize(submitted);

  return expected === actual;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
