import { consumeMagicLink } from "@/lib/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  const user = await consumeMagicLink(token);

  if (!user) {
    return Response.json({ error: "Magic link expired or invalid" }, { status: 400 });
  }

  const destination =
    user.role === "TEACHER" || user.role === "ADMIN" ? "/teacher/dashboard" : "/";

  return Response.redirect(new URL(destination, url.origin));
}
