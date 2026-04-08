import type { Skill } from "@/modules/types";

const PREFIX_BY_SKILL: Record<Skill, string> = {
  reading: "read",
  listening: "listen",
  usee: "usee",
  writing: "writ",
};

export function generateItemId(params: {
  skill: Skill;
  level: string;
  existingIds: string[];
}): string {
  const prefix = PREFIX_BY_SKILL[params.skill];
  const levelPart = params.level.toLowerCase();
  const pattern = new RegExp(`^${prefix}_${levelPart}_(\\d{3})$`);

  const max = params.existingIds.reduce((acc, id) => {
    const match = id.match(pattern);
    if (!match) {
      return acc;
    }

    return Math.max(acc, Number.parseInt(match[1], 10));
  }, 0);

  return `${prefix}_${levelPart}_${String(max + 1).padStart(3, "0")}`;
}
