import { Role } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createMagicLink } from "@/lib/auth";
import { parseJsonBody, toErrorResponse } from "@/lib/validation";

const bodySchema = z.object({
  email: z.string().email(),
  role: z.enum(["teacher", "student", "admin"]).optional(),
});

function parseRole(role?: string): Role {
  if (role === "teacher") {
    return Role.TEACHER;
  }

  if (role === "admin") {
    return Role.ADMIN;
  }

  return Role.STUDENT;
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, bodySchema);

  if ("error" in parsed) {
    return toErrorResponse(parsed.error, 400, parsed.details);
  }

  const { email, role } = parsed.data;
  const userRole = parseRole(role);

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        role: userRole,
      },
    });

    if (userRole === Role.TEACHER) {
      await prisma.teacher.create({
        data: {
          userId: user.id,
        },
      });
    }

    if (userRole === Role.STUDENT) {
      await prisma.student.create({
        data: {
          userId: user.id,
        },
      });
    }
  }

  const { token, expiresAt } = await createMagicLink(email);
  const verifyUrl = new URL("/api/auth/verify", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  verifyUrl.searchParams.set("token", token);

  return Response.json({
    message: "Magic link generated",
    expiresAt,
    verifyUrl: verifyUrl.toString(),
    token,
  });
}
