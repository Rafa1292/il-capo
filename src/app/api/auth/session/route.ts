import { NextRequest, NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/session";

/** Sesión actual (o null). */
export async function GET(req: NextRequest) {
  const session = getSession(req);
  return NextResponse.json({
    session: session
      ? { email: session.email, name: session.name, picture: session.picture, provider: session.provider }
      : null,
  });
}

/** Logout. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
