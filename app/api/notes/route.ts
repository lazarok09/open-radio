import { NextResponse } from "next/server";
import { station, changed } from "@/lib/store";
import { viewerId } from "@/lib/identity";
import { saveNote } from "@/lib/durable";
export async function POST(request: Request) {
  try {
    const user = await viewerId(); if (!user) throw new Error("register your name first");
    const data = await request.formData(); const blob = data.get("audio"); const duration = Number(data.get("duration"));
    if (!(blob instanceof Blob) || blob.type !== "audio/webm" && blob.type !== "audio/webm;codecs=opus") throw new Error("voice note must be WebM audio");
    const note = station.createNote(user, new Uint8Array(await blob.arrayBuffer()), duration); await saveNote(note); changed(); return NextResponse.json({ note: { id: note.id } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "invalid voice note" }, { status: 400 }); }
}
