import { NextResponse } from "next/server";
import { searchProviderTracks } from "@/lib/catalog";
export async function GET(request: Request) { return NextResponse.json({ tracks: await searchProviderTracks(new URL(request.url).searchParams.get("q") ?? "") }); }
