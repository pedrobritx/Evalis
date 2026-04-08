import type { DomainItem, Skill } from "@/modules/types";

export interface ItemSelectionInput {
  items: DomainItem[];
  skill: Skill;
  theta: number;
  usedItemIds: string[];
  recentSubskills: string[];
}

export function selectNextItem({
  items,
  skill,
  theta,
  usedItemIds,
  recentSubskills,
}: ItemSelectionInput): DomainItem | null {
  const unseenItems = items.filter(
    (item) => item.active && item.skill === skill && !usedItemIds.includes(item.id),
  );

  if (unseenItems.length === 0) {
    return null;
  }

  const subskillUsage = recentSubskills.reduce<Record<string, number>>((acc, subskill) => {
    acc[subskill] = (acc[subskill] ?? 0) + 1;
    return acc;
  }, {});

  const sortedByDifficulty = unseenItems
    .map((item) => ({
      item,
      distance: Math.abs(item.difficulty - theta),
      subskillCount: subskillUsage[item.subskill] ?? 0,
    }))
    .sort((a, b) => {
      if (a.distance === b.distance) {
        return a.subskillCount - b.subskillCount;
      }

      return a.distance - b.distance;
    });

  const candidates = sortedByDifficulty.slice(0, 5);
  candidates.sort((a, b) => a.subskillCount - b.subskillCount);

  return candidates[0]?.item ?? null;
}
