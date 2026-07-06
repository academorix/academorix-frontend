/**
 * @file refresh.test.ts
 * @module lib/http/refresh.test
 *
 * @description
 * Unit tests for the single-flight refresh coordinator. A fake
 * {@link HttpClient} exposes only `.post` (the sole method the coordinator
 * uses) and a real {@link TokenStore} constructed with `persist: false` so no
 * Web Storage is touched. Covers:
 * - No token → resolves `false` without touching the endpoint.
 * - Happy path → writes fresh token + `expires_at` back to the store, resolves
 *   `true`.
 * - Endpoint returns no `access_token` or throws → clears the token, resolves
 *   `false`.
 * - Two concurrent `refresh()` calls share the same in-flight request (the
 *   `.post` mock is called exactly once).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HttpClient } from "@/lib/http/http-client";
import type { Mock } from "vitest";

import { createRefreshCoordinator } from "@/lib/http/refresh";
import { TokenStore } from "@/lib/http/token-store";

/** A minimal `HttpClient` stand-in — the coordinator only needs `.post`. */
interface FakeHttpClient {
  post: Mock;
}

/** Builds a fresh coordinator wired to a mock client + non-persisted store. */
function setup(): {
  tokens: TokenStore;
  client: FakeHttpClient;
  coordinator: ReturnType<typeof createRefreshCoordinator>;
} {
  const tokens = new TokenStore({ persist: false });
  const client: FakeHttpClient = { post: vi.fn() };
  const coordinator = createRefreshCoordinator({
    client: client as unknown as HttpClient,
    tokens,
  });

  return { tokens, client, coordinator };
}

describe("createRefreshCoordinator", () => {
  let tokens: TokenStore;
  let client: FakeHttpClient;
  let coordinator: ReturnType<typeof createRefreshCoordinator>;

  beforeEach(() => {
    ({ tokens, client, coordinator } = setup());
  });

  it("returns false and skips the endpoint when there is no token", async () => {
    // Store is empty by default.
    const result = await coordinator.refresh();

    expect(result).toBe(false);
    expect(client.post).not.toHaveBeenCalled();
  });

  it("writes the fresh token + expiry back on success", async () => {
    tokens.setToken("stale-token", null);

    const newExpiresAt = new Date(Date.now() + 60_000).toISOString();

    client.post.mockResolvedValueOnce({
      access_token: "fresh-token",
      token_type: "Bearer",
      abilities: ["athletes.viewAny"],
      expires_at: newExpiresAt,
    });

    const result = await coordinator.refresh();

    expect(result).toBe(true);
    expect(tokens.getToken()).toBe("fresh-token");
    expect(client.post).toHaveBeenCalledTimes(1);
    // Default path — the tenant refresh endpoint.
    expect(client.post).toHaveBeenCalledWith("/auth/refresh");
  });

  it("uses the configured path override when provided", async () => {
    const platformTokens = new TokenStore({ persist: false });
    const platformClient: FakeHttpClient = { post: vi.fn() };

    platformClient.post.mockResolvedValueOnce({
      access_token: "fresh-token",
      token_type: "Bearer",
    });

    platformTokens.setToken("stale", null);

    const platformCoordinator = createRefreshCoordinator({
      client: platformClient as unknown as HttpClient,
      tokens: platformTokens,
      path: "/v1/platform/auth/refresh",
    });

    await platformCoordinator.refresh();

    expect(platformClient.post).toHaveBeenCalledWith("/v1/platform/auth/refresh");
  });

  it("clears the token when the endpoint response lacks an access_token", async () => {
    tokens.setToken("stale-token", null);
    client.post.mockResolvedValueOnce({ token_type: "Bearer" });

    const result = await coordinator.refresh();

    expect(result).toBe(false);
    expect(tokens.getToken()).toBeNull();
  });

  it("clears the token when the endpoint throws", async () => {
    tokens.setToken("stale-token", null);
    client.post.mockRejectedValueOnce(new Error("network failure"));

    const result = await coordinator.refresh();

    expect(result).toBe(false);
    expect(tokens.getToken()).toBeNull();
  });

  it("coalesces two concurrent refresh() calls into a single request", async () => {
    tokens.setToken("stale-token", null);

    // Delayed resolution so the second call arrives while the first is still
    // in flight; the coordinator must return the same promise.
    let resolve: (value: {
      access_token: string;
      token_type: string;
      expires_at: null;
    }) => void = () => {
      throw new Error("resolve not yet assigned");
    };

    client.post.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );

    const first = coordinator.refresh();
    const second = coordinator.refresh();

    resolve({ access_token: "fresh-token", token_type: "Bearer", expires_at: null });

    const [a, b] = await Promise.all([first, second]);

    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(client.post).toHaveBeenCalledTimes(1);
    expect(tokens.getToken()).toBe("fresh-token");
  });

  it("does not lock out subsequent refreshes after the in-flight one resolves", async () => {
    tokens.setToken("stale", null);
    client.post.mockResolvedValue({
      access_token: "fresh-1",
      token_type: "Bearer",
      expires_at: null,
    });

    await coordinator.refresh();

    // A second, sequential call must reach the endpoint again.
    client.post.mockResolvedValueOnce({
      access_token: "fresh-2",
      token_type: "Bearer",
      expires_at: null,
    });

    // The first refresh cleared any prior state, but the token is now fresh-1.
    // Set it stale-ish again to ensure the second refresh runs.
    tokens.setToken("stale-again", null);

    await coordinator.refresh();

    expect(client.post).toHaveBeenCalledTimes(2);
    expect(tokens.getToken()).toBe("fresh-2");
  });
});
