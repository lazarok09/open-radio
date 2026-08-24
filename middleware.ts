import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api/")) return NextResponse.next();
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const started = Date.now();
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("x-request-id", requestId);
  console.info(`[api.request] requestId="${requestId}" method="${request.method}" path="${request.nextUrl.pathname}" status=dispatched durationMs=${Date.now() - started}`);
  return response;
}

export const config = { matcher: ["/api/:path*"] };
