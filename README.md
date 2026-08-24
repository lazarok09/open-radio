# Open Radio

Open Radio is a listener-driven internet radio experience. The final goal is a
shared, real-time station where listeners authenticate with their own Spotify
Premium accounts, queue songs, vote on the sequence, and contribute short
five-second voice drops that are played between songs like a live radio show.

Each listener plays the current Spotify track locally through the Spotify Web
Playback SDK. Open Radio does not download, rebroadcast, or server-side stream
Spotify audio.

## Product flow

1. A listener enters a display name. This creates an anonymous Open Radio
   identity stored in an HTTP-only cookie; no separate Open Radio account is
   required.
2. The listener selects **Connect Spotify** and completes Spotify OAuth with
   their own account.
3. Open Radio searches Spotify's catalog and displays track metadata, including
   the canonical Spotify track URI.
4. The listener queues a track. The station ranks pending tracks by score and
   queue time.
5. Listeners vote tracks up or down. Each listener can vote once per queue
   entry.
6. When the station changes, every connected browser transfers playback to its
   own Spotify Web Playback device and starts the same current Spotify URI.
7. A listener who has at least two pending tracks can record one WebM/Opus voice
   drop. The drop is limited to five seconds and 1 MB and is played as a station
   transition before the next song.

The UI only reports **Playing** after the browser SDK confirms active playback.
Listeners without a connection see a clear Spotify connection prompt and can
still browse, vote, and use the queue.

## Requirements

- [Bun](https://bun.sh/)
- Node-compatible Web Crypto/crypto APIs
- PostgreSQL for durable users, queue, tracks, votes, voice notes, and Spotify
  account sessions
- A Spotify developer application
- A Spotify Premium account for browser playback

## Local development

Install dependencies:

```bash
bun install
```

Start PostgreSQL with the checked-in local-only Compose configuration:

```bash
docker compose up -d postgres
cp .env.example .env.local
bun run db:migrate
bun run dev
```

The Compose credentials are intentionally for local development only. Never use
them outside a local environment.

Useful commands:

```bash
bun run dev          # Start Next.js development server
bun run typecheck    # Run TypeScript checks
bun test             # Run unit and integration-oriented tests
bun run build        # Create a production build
bun run db:migrate   # Apply Drizzle migrations
```

## Environment configuration

Copy `.env.example` to `.env.local` and provide:

```env
DATABASE_URL=postgres://openradio:openradio_dev@localhost:5432/open_radio
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/spotify/callback
SPOTIFY_PRODUCTION_REDIRECT_URI=
SESSION_ENCRYPTION_KEY=
```

Generate the encryption key with:

```bash
openssl rand -base64 32
```

`SESSION_ENCRYPTION_KEY` is used to encrypt Spotify refresh tokens at rest and
sign OAuth state. Keep it secret and stable across deployments. Rotating it
invalidates stored Spotify sessions. Do not commit `.env`, `.env.local`, or any
file containing real credentials.

In the Spotify developer dashboard, allowlist the local and production callback
URLs exactly as configured. Spotify redirect URI matching is exact.

## Architecture

- **Next.js App Router** serves the station UI and API routes.
- **React Query** fetches station snapshots and invalidates them when the
  process-local SSE event bus emits `station.changed`.
- **Station domain model** manages identities, queue ranking, votes, transitions,
  and voice-note eligibility.
- **Spotify catalog provider** uses server-side Client Credentials only for
  search and track lookup.
- **Spotify OAuth** uses Authorization Code with PKCE. The server stores only an
  encrypted refresh token linked to the anonymous listener identity. The browser
  receives short-lived access tokens from `/api/spotify/token`.
- **Spotify Web Playback SDK** runs client-side, creates one browser device per
  session, transfers playback to that device, and starts the station's current
  Spotify URI.
- **PostgreSQL + Drizzle** persist users, Spotify track metadata, queue entries,
  votes, voice notes, station playback data, and Spotify account sessions.

## API surface

### Station and queue

- `GET /api/station` — current station snapshot and viewer state.
- `GET /api/events` — SSE stream for station changes.
- `GET /api/search?q=...` — Spotify catalog search.
- `POST /api/identity` — create or rename the anonymous listener identity.
- `POST /api/queue` — queue a Spotify track by ID.
- `POST /api/votes` — upvote or downvote a queue entry.
- `POST /api/notes` — submit a five-second WebM/Opus voice drop.

### Spotify authentication

- `GET /api/spotify/login` — creates signed state and PKCE values, then starts
  Spotify authorization.
- `GET /api/spotify/callback` — validates state, exchanges the code, associates
  the Spotify account, encrypts the refresh token, and returns to the station.
- `GET /api/spotify/token` — refreshes the listener's token server-side and
  returns only a short-lived access token.

The client secret and refresh token are never returned to the browser.

## Security and policy boundaries

- Spotify playback is interactive and listener-specific. Open Radio does not
  create a public server-side audio stream.
- OAuth state is short-lived, signed, HTTP-only, and validated on callback.
- PKCE protects the authorization-code exchange.
- Refresh tokens are encrypted with AES-GCM before persistence and rotated when
  Spotify returns a replacement token.
- The anonymous identity cookie is opaque, HTTP-only, SameSite `lax`, and secure
  in production.
- External input is validated before it reaches station mutations or persistence.

## Operational constraints

The current SSE transport and station clock are process-local. This deployment
must run as a single application instance. For horizontal scaling, replace the
in-process event bus and station state with shared durable state and pub/sub.

Voice notes are WebM/Opus, at most five seconds and 1 MB. The current prototype
stores voice-note bytes in PostgreSQL; production deployments should evaluate
object storage and retention policies before scaling recording volume.

## Verification

The repository includes coverage for station ranking, voting, voice-note rules,
SSE publication, canonical Spotify URIs, and signed OAuth/PKCE state validation.
Before deployment, also verify the real browser flow with a Spotify Premium test
account: OAuth callback, SDK readiness, device transfer, autoplay handling,
account errors, device loss, and queue transitions.
