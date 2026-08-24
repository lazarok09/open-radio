import { NextResponse } from "next/server";
import { getProviderTrack } from "@/lib/catalog";
import { station, changed } from "@/lib/store";
import { viewerId } from "@/lib/identity";
import { enqueueSchema } from "@/lib/validation";
import { saveQueue } from "@/lib/durable";
export async function POST(request: Request) { try { const user = await viewerId(); if (!user) throw new Error("register your name first"); const { trackId } = enqueueSchema.parse(await request.json()); const track = await getProviderTrack(trackId); if (!track) throw new Error("track not found"); const entry = station.enqueue(user, track); station.startIfIdle(); await saveQueue(user, track, entry); changed(); return NextResponse.json({ entry }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "invalid request" }, { status: 400 }); } }
