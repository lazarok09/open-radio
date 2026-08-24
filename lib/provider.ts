import type { Track } from "./station";

export interface MusicProvider { search(query: string): Promise<Track[]>; getTrack(id: string): Promise<Track | null>; }

class SpotifyProvider implements MusicProvider {
  private token: { value: string; expiresAt: number } | null = null;
  private async accessToken() {
    if (this.token && this.token.expiresAt > Date.now() + 30_000) return this.token.value;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error("Spotify credentials are not configured");
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Spotify authentication failed");
    const body = await response.json() as { access_token: string; expires_in: number };
    this.token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    return body.access_token;
  }

  async search(query: string) {
    if (!query.trim()) return [];
    const token = await this.accessToken();
    const response = await fetch(`https://api.spotify.com/v1/search?type=track&limit=12&q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!response.ok) throw new Error("Spotify search failed");
    const body = await response.json() as { tracks?: { items: Array<{ id: string; uri: string; name: string; artists: Array<{ name: string }>; album: { images: Array<{ url: string }> }; duration_ms: number }> } };
    return (body.tracks?.items ?? []).map((item) => ({ id: item.id, spotifyUri: item.uri, title: item.name, artist: item.artists.map((artist) => artist.name).join(", "), artwork: item.album.images[0]?.url ?? "/artwork.svg", durationSeconds: Math.round(item.duration_ms / 1000) }));
  }

  async getTrack(id: string) {
    const token = await this.accessToken();
    const response = await fetch(`https://api.spotify.com/v1/tracks/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Spotify track lookup failed");
    const item = await response.json() as { id: string; uri: string; name: string; artists: Array<{ name: string }>; album: { images: Array<{ url: string }> }; duration_ms: number };
    return { id: item.id, spotifyUri: item.uri, title: item.name, artist: item.artists.map((artist) => artist.name).join(", "), artwork: item.album.images[0]?.url ?? "/artwork.svg", durationSeconds: Math.round(item.duration_ms / 1000) };
  }
}

export const musicProvider: MusicProvider = new SpotifyProvider();
