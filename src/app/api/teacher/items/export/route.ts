import { Role } from "@prisma/client";

import { requireRole } from "@/lib/auth";
import { toErrorResponse } from "@/lib/validation";
import { exportItems } from "@/modules/item-bank/item-service";

export async function GET() {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  if (!user) {
    return toErrorResponse("Unauthorized", 401);
  }

  const items = await exportItems();

  return new Response(JSON.stringify({ items }, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=evalis-item-bank.json",
    },
  });
}
