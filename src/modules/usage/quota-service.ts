import { OwnerType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface QuotaCheckInput {
  ownerType: OwnerType;
  ownerId: string;
  dailyLimit: number;
  perStudentLimit: number;
}

function dayStart(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function getOrCreateQuota(input: QuotaCheckInput) {
  const date = dayStart();

  return prisma.usageQuota.upsert({
    where: {
      ownerType_ownerId_date: {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        date,
      },
    },
    update: {},
    create: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      date,
      dailyLimit: input.dailyLimit,
      perStudentLimit: input.perStudentLimit,
    },
  });
}

export async function checkQuota(input: QuotaCheckInput) {
  const quota = await getOrCreateQuota(input);

  if (quota.dailyUsed >= quota.dailyLimit) {
    return { allowed: false, reason: "Daily limit reached" };
  }

  if (quota.perStudentUsed >= quota.perStudentLimit) {
    return { allowed: false, reason: "Per-student limit reached" };
  }

  return { allowed: true, reason: null };
}

export async function consumeQuota(input: QuotaCheckInput) {
  const date = dayStart();

  return prisma.usageQuota.upsert({
    where: {
      ownerType_ownerId_date: {
        ownerType: input.ownerType,
        ownerId: input.ownerId,
        date,
      },
    },
    update: {
      dailyUsed: { increment: 1 },
      perStudentUsed: { increment: 1 },
      dailyLimit: input.dailyLimit,
      perStudentLimit: input.perStudentLimit,
    },
    create: {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      date,
      dailyUsed: 1,
      dailyLimit: input.dailyLimit,
      perStudentUsed: 1,
      perStudentLimit: input.perStudentLimit,
    },
  });
}

export async function getUsageSnapshot(ownerType: OwnerType, ownerId: string) {
  return prisma.usageQuota.findMany({
    where: {
      ownerType,
      ownerId,
    },
    orderBy: {
      date: "desc",
    },
    take: 14,
  });
}

export const DEFAULT_TEACHER_LIMITS = {
  dailyLimit: 100,
  perStudentLimit: 10,
};

export const DEFAULT_STUDENT_LIMITS = {
  dailyLimit: 20,
  perStudentLimit: 5,
};

export type QuotaTransaction = Prisma.UsageQuotaGetPayload<Record<string, never>>;
