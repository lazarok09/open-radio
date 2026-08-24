import { NextResponse } from "next/server";
import { station, changed } from "@/lib/store";
import { viewerId } from "@/lib/identity";
import { voteSchema } from "@/lib/validation";
import { saveVote } from "@/lib/durable";
export async function POST(request: Request) { try { const user = await viewerId(); if (!user) throw new Error("register your name first"); const { entryId, direction } = voteSchema.parse(await request.json()); const entry = station.vote(user, entryId, direction); await saveVote(user, entryId, direction); changed(); return NextResponse.json({ entry }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "invalid request" }, { status: 400 }); } }
