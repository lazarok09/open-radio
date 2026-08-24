import { describe, expect, test } from "bun:test";
import { createPkce, readPkce } from "../lib/spotify-oauth";

describe("Spotify OAuth state", () => {
  test("round-trips a signed PKCE verifier and rejects a different state", () => {
    process.env.SESSION_ENCRYPTION_KEY = "test-session-key";
    const pkce = createPkce();
    expect(readPkce(pkce.value, pkce.state)).toHaveLength(43);
    expect(() => readPkce(pkce.value, "wrong-state")).toThrow("invalid Spotify OAuth state");
  });

  test("rejects a tampered verifier", () => {
    process.env.SESSION_ENCRYPTION_KEY = "test-session-key";
    const pkce = createPkce();
    const parts = pkce.value.split(".");
    parts[1] = `${parts[1]}x`;
    expect(() => readPkce(parts.join("."), pkce.state)).toThrow("invalid Spotify OAuth state");
  });
});
