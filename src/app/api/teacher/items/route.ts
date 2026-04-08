import { Role } from "@prisma/client";

import { requireRole } from "@/lib/auth";
import { parseJsonBody, toErrorResponse } from "@/lib/validation";
import {
  itemPayloadSchema,
  itemUpdateSchema,
} from "@/modules/item-bank/item-schema";
import {
  createItem,
  deleteItem,
  listItems,
  updateItem,
} from "@/modules/item-bank/item-service";
import { prisma } from "@/lib/prisma";

async function getTeacherIdForUser(userId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  return teacher?.id;
}

export async function GET(request: Request) {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  if (!user) {
    return toErrorResponse("Unauthorized", 401);
  }

  const url = new URL(request.url);
  const skill = url.searchParams.get("skill") ?? undefined;
  const items = await listItems(skill ?? undefined);

  return Response.json({ items });
}

export async function POST(request: Request) {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  if (!user) {
    return toErrorResponse("Unauthorized", 401);
  }

  const parsed = await parseJsonBody(request, itemPayloadSchema);

  if ("error" in parsed) {
    return toErrorResponse(parsed.error, 400, parsed.details);
  }

  const teacherId = await getTeacherIdForUser(user.id);
  const item = await createItem(parsed.data, teacherId);

  return Response.json({ item }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  if (!user) {
    return toErrorResponse("Unauthorized", 401);
  }

  const parsed = await parseJsonBody(request, itemUpdateSchema);

  if ("error" in parsed) {
    return toErrorResponse(parsed.error, 400, parsed.details);
  }

  const item = await updateItem(parsed.data);
  return Response.json({ item });
}

export async function DELETE(request: Request) {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  if (!user) {
    return toErrorResponse("Unauthorized", 401);
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return toErrorResponse("Missing id query parameter", 400);
  }

  await deleteItem(id);
  return Response.json({ deleted: true });
}
