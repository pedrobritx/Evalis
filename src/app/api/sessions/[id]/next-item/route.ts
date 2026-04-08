import { z } from "zod";

import { getNextItemForSkill } from "@/modules/assessment/session-service";
import { toErrorResponse } from "@/lib/validation";

const skillSchema = z.enum(["reading", "listening", "usee", "writing"]);

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const maybeSkill = url.searchParams.get("skill");
  const parsedSkill = skillSchema.safeParse(maybeSkill);

  if (!parsedSkill.success) {
    return toErrorResponse("Invalid skill query parameter", 400);
  }

  try {
    const next = await getNextItemForSkill(id, parsedSkill.data);

    return Response.json(next);
  } catch (error) {
    return toErrorResponse(
      error instanceof Error ? error.message : "Could not fetch next item",
      404,
    );
  }
}
