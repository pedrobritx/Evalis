import { z } from "zod";

import { createSession } from "@/modules/assessment/session-service";
import { parseJsonBody, toErrorResponse } from "@/lib/validation";

const createSessionSchema = z.object({
  studentId: z.string().min(1),
  mode: z.enum(["short", "full"]),
});

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createSessionSchema);

  if ("error" in parsed) {
    return toErrorResponse(parsed.error, 400, parsed.details);
  }

  const session = await createSession(parsed.data.studentId, parsed.data.mode);

  return Response.json({
    session: {
      id: session.id,
      studentId: session.studentId,
      mode: session.mode.toLowerCase(),
      status: session.status,
      startedAt: session.startedAt,
    },
  });
}
