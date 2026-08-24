import { NextResponse } from "next/server";
import { viewerId } from "@/lib/identity";
import { createPkce, oauthCookieName, spotifyAuthorizationUrl } from "@/lib/spotify-oauth";
import { station } from "@/lib/store";
export async function GET() { try { const userId = await viewerId(); if (!userId || !station.hasUser(userId)) return NextResponse.json({ error: "register your name first" }, { status: 401 }); const { state, challenge, value } = createPkce(); const [, , expiry] = value.split("."); const response = NextResponse.redirect(spotifyAuthorizationUrl(state, challenge)); response.cookies.set(oauthCookieName(), value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: Math.max(1, Math.ceil((Number(expiry) - Date.now()) / 1000)) }); return response; } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Spotify configuration error" }, { status: 500 }); } }
