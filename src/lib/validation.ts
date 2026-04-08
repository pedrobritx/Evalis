import { z, ZodError } from "zod";

export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ data: T } | { error: string; details?: string[] }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        error: "Invalid request body",
        details: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
      };
    }

    return { error: "Invalid JSON payload" };
  }
}

export function toErrorResponse(error: string, status = 400, details?: string[]) {
  return Response.json({ error, details }, { status });
}
