/**
 * @file refresh-coordinator.test.ts
 * @module @academorix/http/refresh/refresh-coordinator.test
 *
 * @description
 * Unit tests for the single-flight refresh coordinator. A minimal
 * {@link HttpClient} stand-in exposes only `.post` (the sole method
 * the coordinator uses) and a real {@link TokenStore} constructed
 * with `persist: false` so no Web Storage is touched. Covers the
 * empty-token short-circuit, the happy path, the two failure modes
 * (thrown error and response without `access_token`), the
 * single-flight lock, the reset-after-completion behaviour, and the
 * custom-path override.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { TokenStore } from "../../tokens/token-store";
import { createRefreshCoordinator } from "../refresh-coordinator";

import type { HttpClient } from "../../client/http-client";
import type { Mock } from "vitest";

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

  it("returns false without hitting the endpoint when the token store is empty", async () => {
    const result = await coordinator.refresh();

    expect(result).toBe(false);
    expect(client.post).not.toHaveBeenCalled();
  });

  it("writes the fresh token and expiry to the store on a successful refresh", async () => {
    tokens.setToken("stale", null);

    const expiresAt = new Date(Date.now() + 60_000).toISOString();

    client.post.mockResolvedValueOnce({
      access_token: "fresh",
      token_type: "Bearer",
      expires_at: expiresAt,
    });

    const result = await coordinator.refresh();

    expect(result).toBe(true);
    expect(tokens.getToken()).toBe("fresh");
    expect(client.post).toHaveBeenCalledTimes(1);
    expect(client.post).toHaveBeenCalledWith("/auth/refresh");
  });

  it("clears the token and returns false when the refresh call throws", async () => {
    tokens.setToken("stale", null);
    client.post.mockRejectedValueOnce(new Error("network failure"));

    const result = await coordinator.refresh();

    expect(result).toBe(false);
    expect(tokens.getToken()).toBeNull();
  });

  it("clears the token and returns false when the response has no access_token", async () => {
    tokens.setToken("stale", null);
    client.post.mockResolvedValueOnce({ token_type: "Bearer" });

    const result = await coordinator.refresh();

    expect(result).toBe(false);
    expect(tokens.getToken()).toBeNull();
  });

  it("coalesces two concurrent refresh calls into a single request (single-flight)", async () => {
    tokens.setToken("stale", null);

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

    resolve({ access_token: "fresh", token_type: "Bearer", expires_at: null });

    const [a, b] = await Promise.all([first, second]);

    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(client.post).toHaveBeenCalledTimes(1);
    expect(tokens.getToken()).toBe("fresh");
  });

  it("starts a fresh request on the next call once the previous one has resolved", async () => {
    tokens.setToken("stale-1", null);
    client.post.mockResolvedValueOnce({
      access_token: "fresh-1",
      token_type: "Bearer",
      expires_at: null,
    });

    await coordinator.refresh();

    client.post.mockResolvedValueOnce({
      access_token: "fresh-2",
      token_type: "Bearer",
      expires_at: null,
    });

    // Set a fresh stale-ish token so the next refresh proceeds.
    tokens.setToken("stale-2", null);
    await coordinator.refresh();

    expect(client.post).toHaveBeenCalledTimes(2);
    expect(tokens.getToken()).toBe("fresh-2");
  });

  it("uses the configured path option when provided", async () => {
    const platformTokens = new TokenStore({ persist: false });
    const platformClient: FakeHttpClient = { post: vi.fn() };

    platformClient.post.mockResolvedValueOnce({
      access_token: "fresh",
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
});
