import { OwnerType, Role } from "@prisma/client";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/validation";
import { getUsageSnapshot } from "@/modules/usage/quota-service";

export async function GET() {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  if (!user) {
    return toErrorResponse("Unauthorized", 401);
  }

  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });

  if (!teacher) {
    return toErrorResponse("Teacher account not found", 404);
  }

  const quotas = await getUsageSnapshot(OwnerType.TEACHER, teacher.id);

  const recentAuditLogs = await prisma.auditLog.findMany({
    where: {
      actorId: user.id,
      action: "writing_evaluation",
    },
    orderBy: {
      timestamp: "desc",
    },
    take: 20,
  });

  return Response.json({
    quotas,
    recentAuditLogs,
  });
}
