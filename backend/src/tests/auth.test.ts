import { describe, it, expect } from "vitest";
import { hashRefreshToken } from "../lib/refreshToken";

describe("refresh token hashing", () => {
  it("returns a stable sha256 hash", () => {
    const token = "sample-refresh-token";
    const hash = hashRefreshToken(token);

    expect(hash).toHaveLength(64);
    expect(hashRefreshToken(token)).toBe(hash);
  });

  it("produces different hashes for different tokens", () => {
    expect(hashRefreshToken("token-a")).not.toBe(hashRefreshToken("token-b"));
  });
});
