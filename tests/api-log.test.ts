import { describe, expect, test } from "bun:test";
import { formatApiError } from "../lib/api-log";

describe("API error logging", () => {
  test("includes request context and a safe validation reason", () => {
    const line = formatApiError({ requestId: "req-123", method: "POST", path: "/api/identity", status: 400, error: new Error("display name must be 2–32 characters") });
    expect(line).toContain('requestId="req-123"');
    expect(line).toContain('path="/api/identity"');
    expect(line).toContain('status=400');
    expect(line).toContain("display name must be 2–32 characters");
  });
});
