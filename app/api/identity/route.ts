import { NextResponse } from "next/server";
import { station, changed } from "@/lib/store";
import { identityCookie, viewerId } from "@/lib/identity";
import { nameSchema } from "@/lib/validation";
import { saveUser } from "@/lib/durable";
import { logApiError } from "@/lib/api-log";
export async function POST(request: Request) {
  try { const input = nameSchema.parse(await request.json()); const existing = await viewerId(); const user = existing && station.hasUser(existing) ? station.rename(existing, input.displayName) : station.register(input.displayName); await saveUser(user); const response = NextResponse.json({ user }); response.cookies.set(identityCookie, user.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 }); changed(); return response; }
  catch (error) { logApiError({ requestId: request.headers.get("x-request-id") ?? "unassigned", method: request.method, path: new URL(request.url).pathname, status: 400, error }); return NextResponse.json({ error: error instanceof Error ? error.message : "invalid identity" }, { status: 400 }); }
}
