import { Prisma, type Item } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { generateItemId } from "@/modules/item-bank/id-generator";
import {
  skillSchema,
  type ItemPayload,
  type ItemUpdatePayload,
} from "@/modules/item-bank/item-schema";
import { toDomainSkill, toPrismaSkill } from "@/modules/prisma-mappers";

function normalizeOptions(options?: string[]) {
  if (!options || options.length === 0) {
    return Prisma.JsonNull;
  }

  return [...options];
}

function toDomainItem(item: Item) {
  return {
    id: item.id,
    skill: toDomainSkill(item.skill),
    subskill: item.subskill,
    level: item.level,
    difficulty: item.difficulty,
    type: item.type,
    question: item.question,
    options: Array.isArray(item.options) ? (item.options as string[]) : undefined,
    answer: item.answer,
    explanation: item.explanation ?? undefined,
    active: item.active,
  };
}

export async function listItems(skill?: string) {
  const parsedSkill = skill ? skillSchema.safeParse(skill) : null;
  const items = await prisma.item.findMany({
    where:
      parsedSkill && parsedSkill.success
        ? { skill: toPrismaSkill(parsedSkill.data) }
        : undefined,
    orderBy: [{ skill: "asc" }, { difficulty: "asc" }, { id: "asc" }],
  });

  return items.map(toDomainItem);
}

export async function createItem(payload: ItemPayload, teacherId?: string) {
  const existingIds = await prisma.item.findMany({
    where: {
      skill: toPrismaSkill(payload.skill),
      level: payload.level,
    },
    select: { id: true },
  });

  const id =
    payload.id ??
    generateItemId({
      skill: payload.skill,
      level: payload.level,
      existingIds: existingIds.map((item) => item.id),
    });

  const created = await prisma.item.create({
    data: {
      id,
      skill: toPrismaSkill(payload.skill),
      subskill: payload.subskill,
      level: payload.level,
      difficulty: payload.difficulty,
      type: payload.type,
      question: payload.question,
      options: normalizeOptions(payload.options),
      answer: payload.answer,
      explanation: payload.explanation,
      active: payload.active,
      createdByTeacherId: teacherId,
    },
  });

  return toDomainItem(created);
}

export async function updateItem(payload: ItemUpdatePayload) {
  const updated = await prisma.item.update({
    where: { id: payload.id },
    data: {
      skill: payload.skill ? toPrismaSkill(payload.skill) : undefined,
      subskill: payload.subskill,
      level: payload.level,
      difficulty: payload.difficulty,
      type: payload.type,
      question: payload.question,
      options: payload.options ? normalizeOptions(payload.options) : undefined,
      answer: payload.answer,
      explanation: payload.explanation,
      active: payload.active,
    },
  });

  return toDomainItem(updated);
}

export async function deleteItem(itemId: string) {
  await prisma.item.delete({ where: { id: itemId } });
}

export async function importItems(items: ItemPayload[], teacherId?: string) {
  const output: Array<ReturnType<typeof toDomainItem>> = [];

  for (const item of items) {
    const data = {
      id: item.id,
      skill: toPrismaSkill(item.skill),
      subskill: item.subskill,
      level: item.level,
      difficulty: item.difficulty,
      type: item.type,
      question: item.question,
      options: normalizeOptions(item.options),
      answer: item.answer,
      explanation: item.explanation,
      active: item.active,
      createdByTeacherId: teacherId,
    };

    const upserted: Item = item.id
      ? await prisma.item.upsert({
          where: { id: item.id },
          update: data,
          create: {
            ...data,
            id: item.id,
          },
        })
      : await prisma.item.create({
          data: {
            ...data,
            id: generateItemId({
              skill: item.skill,
              level: item.level,
              existingIds: output.map((entry) => entry.id),
            }),
          },
        });

    output.push(toDomainItem(upserted));
  }

  return output;
}

export async function exportItems() {
  const items = await prisma.item.findMany({
    orderBy: [{ skill: "asc" }, { id: "asc" }],
  });

  return items.map(toDomainItem);
}
