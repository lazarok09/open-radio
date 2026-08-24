export type Track = { id: string; spotifyUri: string; title: string; artist: string; artwork: string; durationSeconds: number };
export type VoteDirection = "up" | "down";
export type QueueItem = { id: string; track: Track; addedBy: string; queuedAt: number; score: number; played: boolean };
type User = { id: string; displayName: string };
export type VoiceNote = { id: string; userId: string; audio: Uint8Array; durationSeconds: number; status: "pending" | "playing"; createdAt: number };

const MAX_NOTE_BYTES = 1_000_000;
const MAX_NOTE_SECONDS = 5;
const id = () => crypto.randomUUID();

/** Deterministic domain model. Production repository can hydrate/persist these records. */
export class Station {
  private users = new Map<string, User>();
  private queue: QueueItem[] = [];
  private votes = new Map<string, VoteDirection>();
  private notes: VoiceNote[] = [];
  private current: QueueItem | null = null;

  restore(input: { users: Array<{ id: string; displayName: string }>; queue: QueueItem[]; votes: Array<{ userId: string; entryId: string; direction: VoteDirection }> }) {
    this.users = new Map(input.users.map((user) => [user.id, { ...user }]));
    this.queue = input.queue.map((entry) => ({ ...entry, track: { ...entry.track } }));
    this.votes = new Map(input.votes.map((vote) => [`${vote.userId}:${vote.entryId}`, vote.direction]));
  }

  hasUser(userId: string) { return this.users.has(userId); }

  register(displayName: string) {
    const normalized = displayName.trim().replace(/\s+/g, " ");
    if (normalized.length < 2 || normalized.length > 32) throw new Error("display name must be 2–32 characters");
    const user = { id: id(), displayName: normalized };
    this.users.set(user.id, user);
    return user;
  }

  rename(userId: string, displayName: string) {
    const existing = this.requireUser(userId);
    const normalized = displayName.trim().replace(/\s+/g, " ");
    if (normalized.length < 2 || normalized.length > 32) throw new Error("display name must be 2–32 characters");
    existing.displayName = normalized;
    return existing;
  }

  enqueue(userId: string, track: Track) {
    this.requireUser(userId);
    if (!track.id || !track.title || !track.artist || !Number.isFinite(track.durationSeconds)) throw new Error("invalid track");
    const entry: QueueItem = { id: id(), track, addedBy: userId, queuedAt: Date.now(), score: 1, played: false };
    this.queue.push(entry);
    return entry;
  }

  startIfIdle() {
    if (!this.current) this.current = this.sortedQueue()[0] ?? null;
    return this.current;
  }

  vote(userId: string, entryId: string, direction: VoteDirection) {
    this.requireUser(userId);
    const entry = this.queue.find((item) => item.id === entryId && !item.played);
    if (!entry) throw new Error("queue entry not found");
    const key = `${userId}:${entryId}`;
    if (this.votes.has(key)) throw new Error("already voted for this track");
    this.votes.set(key, direction);
    entry.score = Math.max(1, entry.score + (direction === "up" ? 1 : -1));
    return entry;
  }

  createNote(userId: string, audio: Uint8Array, durationSeconds: number) {
    this.requireUser(userId);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > MAX_NOTE_SECONDS || audio.byteLength > MAX_NOTE_BYTES) {
      throw new Error("voice notes must be no more than 5 seconds and 1 MB");
    }
    if (this.notes.some((note) => note.userId === userId && note.status === "pending")) throw new Error("you already have a pending note");
    const pendingTracks = this.queue.filter((entry) => entry.addedBy === userId && !entry.played).length;
    if (pendingTracks < 2) throw new Error("two pending tracks are required to add a voice note");
    const note = { id: id(), userId, audio, durationSeconds, status: "pending" as const, createdAt: Date.now() };
    this.notes.push(note);
    return note;
  }

  advance() {
    const playing = this.notes.find((note) => note.status === "playing");
    if (playing) this.notes = this.notes.filter((note) => note.id !== playing.id);
    const nextNote = this.notes.filter((note) => note.status === "pending").sort((a, b) => a.createdAt - b.createdAt)[0];
    if (nextNote) { nextNote.status = "playing"; return; }
    if (this.current) this.current.played = true;
    this.current = this.sortedQueue()[0] ?? null;
  }

  snapshot(viewerId?: string) {
    const sorted = this.sortedQueue();
    const viewerTracks = viewerId ? this.queue.filter((entry) => entry.addedBy === viewerId && !entry.played).length : 0;
    const playingNote = this.notes.find((note) => note.status === "playing");
    return {
      nowPlaying: this.current ? this.viewEntry(this.current, viewerId) : null,
      queue: sorted.map((item) => this.viewEntry(item, viewerId)),
      voiceNote: playingNote ? { id: playingNote.id, status: playingNote.status, durationSeconds: playingNote.durationSeconds } : null,
      viewer: viewerId && this.users.has(viewerId) ? { ...this.users.get(viewerId)!, noteEligible: viewerTracks >= 2 && !this.notes.some((note) => note.userId === viewerId && note.status === "pending") } : null,
    };
  }

  private sortedQueue() { return this.queue.filter((item) => !item.played && item.id !== this.current?.id).sort((a, b) => b.score - a.score || a.queuedAt - b.queuedAt); }
  private viewEntry(item: QueueItem, viewerId?: string) { return { ...item, voterHasVoted: viewerId ? this.votes.has(`${viewerId}:${item.id}`) : false, addedByName: this.users.get(item.addedBy)?.displayName ?? "Listener" }; }
  private requireUser(userId: string) { const user = this.users.get(userId); if (!user) throw new Error("unknown listener"); return user; }
}
