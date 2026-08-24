import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { queueEntries, tracks, users, voiceNotes, votes, spotifyAccounts } from "@/db/schema";
import type { QueueItem, Track, VoiceNote } from "@/lib/station";

/** Best-effort durable mirror. Domain mutations stay synchronous for the prototype; when
 * PostgreSQL is configured, each successful mutation is written before its HTTP response. */
export async function saveUser(user: { id: string; displayName: string }) { if (!db) return; await db.insert(users).values({ id: user.id, displayName: user.displayName }).onConflictDoUpdate({ target: users.id, set: { displayName: user.displayName } }); }
export async function saveQueue(userId: string, track: Track, entry: QueueItem) { if (!db) return; await db.insert(tracks).values({ id: track.id, spotifyUri: track.spotifyUri, title: track.title, artist: track.artist, artwork: track.artwork, durationSeconds: track.durationSeconds }).onConflictDoNothing(); await db.insert(queueEntries).values({ id: entry.id, userId, trackId: track.id, queuedAt: new Date(entry.queuedAt), score: entry.score, played: entry.played }).onConflictDoNothing(); }
export async function saveVote(userId: string, entryId: string, direction: "up" | "down") { if (!db) return; await db.insert(votes).values({ userId, queueEntryId: entryId, direction }).onConflictDoNothing(); }
export async function saveNote(note: VoiceNote) { if (!db) return; await db.insert(voiceNotes).values({ id: note.id, userId: note.userId, audio: note.audio, durationMilliseconds: Math.round(note.durationSeconds * 1000), status: note.status }); }
export async function saveSpotifyAccount(account: { userId: string; spotifyUserId: string; encryptedRefreshToken: string; tokenExpiresAt: Date }) { if (!db) return false; await db.insert(spotifyAccounts).values(account).onConflictDoUpdate({ target: spotifyAccounts.userId, set: { spotifyUserId: account.spotifyUserId, encryptedRefreshToken: account.encryptedRefreshToken, tokenExpiresAt: account.tokenExpiresAt, updatedAt: new Date() } }); return true; }
export async function getSpotifyAccount(userId: string) { if (!db) return null; return (await db.select().from(spotifyAccounts).where(eq(spotifyAccounts.userId, userId)).limit(1))[0] ?? null; }
