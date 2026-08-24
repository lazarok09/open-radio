type ClockState = { timer: ReturnType<typeof setInterval> | null; tick: (() => void) | null };
const globalState = globalThis as typeof globalThis & { __openRadioClock?: ClockState };
const state = globalState.__openRadioClock ?? (globalState.__openRadioClock = { timer: null, tick: null });

export function installStationClock(tick: () => void, intervalMs: number) {
  state.tick = tick;
  if (!state.timer) {
    state.timer = setInterval(() => state.tick?.(), intervalMs);
    if (typeof state.timer === "object" && "unref" in state.timer) state.timer.unref();
  }
}
