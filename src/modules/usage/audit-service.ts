import { Prisma, type ProviderType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

interface AuditInput {
  actorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  provider?: ProviderType;
  tokenEstimate?: number;
  status: "success" | "failed" | "blocked";
  metadata?: Prisma.InputJsonValue;
}

export async function writeAuditLog(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      provider: input.provider,
      tokenEstimate: input.tokenEstimate,
      status: input.status,
      metadata: input.metadata,
    },
  });
}
