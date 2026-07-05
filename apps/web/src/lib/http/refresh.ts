/**
 * @file refresh.ts
 * @module lib/http/refresh
 *
 * @description
 * Handles Sanctum bearer-token rotation. The backend's `/api/auth/refresh`
 * (tenant) and `/api/v1/platform/auth/refresh` (platform) issue a fresh token
 * that re-encodes the caller's current abilities; a **401** from any endpoint
 * with a still-known token means "your token expired — try to refresh once
 * before treating this as a logout".
 *
 * ## Design
 * The refresh flow is a **single-flight lock**: while one refresh is in
 * progress, concurrent 401s wait on the same promise instead of stampeding the
 * endpoint. On success the retry chain resumes; on failure the token is
 * cleared and the caller's original error propagates so
 * `authProvider.onError` can redirect to `/login`.
 *
 * This module lives outside `HttpClient` (composition, not inheritance) so the
 * refresh mechanic remains unit-testable and can be swapped for a different
 * strategy (e.g. cookie-based refresh) without touching every consumer.
 */

import type { HttpClient } from "@/lib/http/http-client";
import type { TokenStore } from "@/lib/http/token-store";

/** Shape of the refresh endpoint's response body (matches `AuthTokenData`). */
interface RefreshResponse {
  access_token: string;
  token_type: string;
  abilities?: string[];
  expires_at?: string | null;
}

/**
 * Options passed to {@link createRefreshCoordinator}.
 */
export interface RefreshCoordinatorOptions {
  /** HTTP client to call the refresh endpoint through. */
  client: HttpClient;
  /** Shared token store — the freshly-issued token is written here. */
  tokens: TokenStore;
  /** Endpoint path. Defaults to `/auth/refresh` (tenant surface). */
  path?: string;
}

/**
 * A single-flight refresh coordinator. Call {@link RefreshCoordinator.refresh}
 * from a 401 recovery path; concurrent calls share the same in-flight promise.
 */
export interface RefreshCoordinator {
  /**
   * Attempts to refresh the token. Resolves to `true` on success (token store
   * updated) and `false` on failure (token cleared, caller should sign out).
   */
  refresh(): Promise<boolean>;
}

/**
 * Builds a {@link RefreshCoordinator} bound to a HTTP client + token store.
 * Kept as a factory (not a class) so a test can wire in a fake client without
 * needing to mock `fetch`.
 */
export function createRefreshCoordinator(options: RefreshCoordinatorOptions): RefreshCoordinator {
  const path = options.path ?? "/auth/refresh";
  let inFlight: Promise<boolean> | null = null;

  return {
    async refresh(): Promise<boolean> {
      // Coalesce concurrent refreshers.
      if (inFlight) {
        return inFlight;
      }

      inFlight = (async (): Promise<boolean> => {
        // No token → cannot refresh (auth provider will treat this as logout).
        if (!options.tokens.getToken()) {
          return false;
        }

        try {
          const body = await options.client.post<RefreshResponse>(path);

          if (!body?.access_token) {
            options.tokens.clearToken();

            return false;
          }

          options.tokens.setToken(body.access_token, body.expires_at ?? null);

          return true;
        } catch {
          options.tokens.clearToken();

          return false;
        } finally {
          inFlight = null;
        }
      })();

      return inFlight;
    },
  };
}
