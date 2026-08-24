import { stationEvents, STATION_CHANGED } from "@/lib/events";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  const encoder = new TextEncoder();
  let onChanged: (() => void) | undefined;
  let closed = false;
  const cleanup = () => { if (onChanged) stationEvents.off(STATION_CHANGED, onChanged); onChanged = undefined; };
  const stream = new ReadableStream({ start(controller) { const send = () => { if (!closed) { try { controller.enqueue(encoder.encode("event: station.changed\ndata: {}\n\n")); } catch { closed = true; cleanup(); } } }; onChanged = send; stationEvents.on(STATION_CHANGED, send); request.signal.addEventListener("abort", () => { closed = true; cleanup(); try { controller.close(); } catch {} }, { once: true }); send(); }, cancel() { closed = true; cleanup(); } });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}
