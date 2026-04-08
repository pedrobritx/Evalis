import { Role } from "@prisma/client";

import { requireRole } from "@/lib/auth";
import { parseJsonBody, toErrorResponse } from "@/lib/validation";
import { itemImportSchema } from "@/modules/item-bank/item-schema";
import { importItems } from "@/modules/item-bank/item-service";
import { prisma } from "@/lib/prisma";

async function getTeacherIdForUser(userId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  return teacher?.id;
}

export async function POST(request: Request) {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  if (!user) {
    return toErrorResponse("Unauthorized", 401);
  }

  const parsed = await parseJsonBody(request, itemImportSchema);

  if ("error" in parsed) {
    return toErrorResponse(parsed.error, 400, parsed.details);
  }

  const teacherId = await getTeacherIdForUser(user.id);
  const items = await importItems(parsed.data.items, teacherId);

  return Response.json({ items, imported: items.length });
}
