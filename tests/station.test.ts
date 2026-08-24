import { describe, expect, test } from "bun:test";
import { Station } from "../lib/station";
import { publishStationChanged, stationEvents, STATION_CHANGED } from "../lib/events";

const track = (id: string, title = id) => ({ id, spotifyUri: `spotify:track:${id}`, title, artist: "Test FM", artwork: "/artwork.svg", durationSeconds: 180 });

describe("Station", () => {
  test("permanently counts a user's vote once and keeps score at least one", () => {
    const station = new Station();
    const user = station.register("Dean");
    const entry = station.enqueue(user.id, track("one"));
    station.vote(user.id, entry.id, "down");
    expect(station.snapshot(user.id).queue[0]?.score).toBe(1);
    expect(() => station.vote(user.id, entry.id, "up")).toThrow("already voted");
  });

  test("sorts unplayed tracks by descending score then original queue time", () => {
    const station = new Station();
    const a = station.register("Alice");
    const b = station.register("Bobby");
    const first = station.enqueue(a.id, track("first"));
    const second = station.enqueue(b.id, track("second"));
    station.vote(b.id, second.id, "up");
    expect(station.snapshot(a.id).queue.map((item) => item.track.id)).toEqual(["second", "first"]);
  });

  test("keeps the canonical Spotify URI in queue snapshots", () => {
    const station = new Station();
    const user = station.register("Listener");
    station.enqueue(user.id, track("uri-track"));
    expect(station.snapshot(user.id).nowPlaying).toBeNull();
    station.startIfIdle();
    expect(station.snapshot(user.id).nowPlaying?.track.spotifyUri).toBe("spotify:track:uri-track");
  });

  test("allows one pending note only when the author has two pending tracks, then consumes it", () => {
    const station = new Station();
    const user = station.register("DJ");
    station.enqueue(user.id, track("one"));
    station.enqueue(user.id, track("two"));
    const note = station.createNote(user.id, new Uint8Array([1, 2]), 4);
    expect(note.status).toBe("pending");
    expect(() => station.createNote(user.id, new Uint8Array([3]), 2)).toThrow("pending note");
    station.advance();
    expect(station.snapshot(user.id).voiceNote?.status).toBe("playing");
    station.advance();
    expect(station.snapshot(user.id).voiceNote).toBeNull();
  });

  test("does not let one listener's pending note block another eligible listener", () => {
    const station = new Station();
    const first = station.register("First");
    const second = station.register("Second");
    station.enqueue(first.id, track("a")); station.enqueue(first.id, track("b"));
    station.enqueue(second.id, track("c")); station.enqueue(second.id, track("d"));
    station.createNote(first.id, new Uint8Array([1]), 1);
    expect(station.createNote(second.id, new Uint8Array([2]), 1).status).toBe("pending");
  });

  test("rejects invalid name and over-limit notes atomically", () => {
    const station = new Station();
    expect(() => station.register(" ")).toThrow("display name");
    const user = station.register("Safe");
    station.enqueue(user.id, track("one"));
    station.enqueue(user.id, track("two"));
    expect(() => station.createNote(user.id, new Uint8Array(1_000_001), 6)).toThrow("5 seconds");
    expect(station.snapshot(user.id).voiceNote).toBeNull();
  });

  test("publishes the station.changed SSE event", () => {
    let calls = 0;
    const listener = () => { calls += 1; };
    stationEvents.on(STATION_CHANGED, listener);
    publishStationChanged();
    stationEvents.off(STATION_CHANGED, listener);
    expect(calls).toBe(1);
  });
});
