import { NextResponse } from "next/server";
import { station, ready } from "@/lib/store";
import { viewerId } from "@/lib/identity";
export const dynamic = "force-dynamic";
export async function GET() { await ready; return NextResponse.json(station.snapshot(await viewerId())); }
