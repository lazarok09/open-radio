import { NextResponse } from "next/server";
import { viewerId } from "@/lib/identity";
import { refreshForUser } from "@/lib/spotify-oauth";
export async function GET() { try { const userId = await viewerId(); if (!userId) return NextResponse.json({ error: "register your name first", code: "IDENTITY_REQUIRED" }, { status: 401 }); return NextResponse.json({ access_token: await refreshForUser(userId) }); } catch (error) { const code = (error as { code?: string }).code ?? "SPOTIFY_UNAVAILABLE"; return NextResponse.json({ error: error instanceof Error ? error.message : "Spotify token unavailable", code }, { status: code === "SPOTIFY_NOT_CONNECTED" ? 401 : 502 }); } }
