import { finalizeSession } from "@/modules/assessment/session-service";
import { toErrorResponse } from "@/lib/validation";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const report = await finalizeSession(id);
    return Response.json({ report });
  } catch (error) {
    return toErrorResponse(
      error instanceof Error ? error.message : "Failed to finalize session",
      400,
    );
  }
}
