import { Station } from "./station";
import { publishStationChanged } from "./events";
import { db } from "@/db/client";
import { queueEntries, tracks, users, votes } from "@/db/schema";
import { installStationClock } from "./clock";
export const station = new Station();
export function changed() { publishStationChanged(); }

export const ready = (async () => {
  if (!db) return;
  const [storedUsers, storedQueue, storedTracks, storedVotes] = await Promise.all([db.select().from(users), db.select().from(queueEntries), db.select().from(tracks), db.select().from(votes)]);
  const tracksById = new Map(storedTracks.map((track) => [track.id, track]));
  station.restore({ users: storedUsers.map((user) => ({ id: user.id, displayName: user.displayName })), queue: storedQueue.flatMap((entry) => { const track = tracksById.get(entry.trackId); return track ? [{ id: entry.id, track: { id: track.id, spotifyUri: track.spotifyUri, title: track.title, artist: track.artist, artwork: track.artwork, durationSeconds: track.durationSeconds }, addedBy: entry.userId, queuedAt: entry.queuedAt.getTime(), score: entry.score, played: entry.played }] : []; }), votes: storedVotes.map((vote) => ({ userId: vote.userId, entryId: vote.queueEntryId, direction: vote.direction })) });
})();

// The prototype's station account advances on one server-owned clock. `unref` avoids
// keeping test and build workers alive solely for the simulated player.
installStationClock(() => { station.advance(); changed(); }, 30_000);
