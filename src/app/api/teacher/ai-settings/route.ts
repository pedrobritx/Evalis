import { ProviderType, Role } from "@prisma/client";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { parseJsonBody, toErrorResponse } from "@/lib/validation";

const bodySchema = z.object({
  provider: z.enum(["OPENAI", "OLLAMA", "CUSTOM"]).default("OPENAI"),
  apiKey: z.string().min(10).optional(),
});

export async function GET() {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  if (!user) {
    return toErrorResponse("Unauthorized", 401);
  }

  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });

  if (!teacher) {
    return toErrorResponse("Teacher account not found", 404);
  }

  return Response.json({
    provider: teacher.aiProvider ?? ProviderType.OPENAI,
    hasStoredKey: Boolean(teacher.aiKeyEncrypted),
  });
}

export async function POST(request: Request) {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  if (!user) {
    return toErrorResponse("Unauthorized", 401);
  }

  const parsed = await parseJsonBody(request, bodySchema);

  if ("error" in parsed) {
    return toErrorResponse(parsed.error, 400, parsed.details);
  }

  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });

  if (!teacher) {
    return toErrorResponse("Teacher account not found", 404);
  }

  const encrypted = parsed.data.apiKey ? encryptSecret(parsed.data.apiKey) : undefined;

  const updated = await prisma.teacher.update({
    where: { id: teacher.id },
    data: {
      aiProvider: parsed.data.provider as ProviderType,
      aiKeyEncrypted: encrypted ?? teacher.aiKeyEncrypted,
    },
  });

  return Response.json({
    provider: updated.aiProvider,
    hasStoredKey: Boolean(updated.aiKeyEncrypted),
  });
}
