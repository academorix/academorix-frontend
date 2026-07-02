/**
 * @file auth-provider.rest.ts
 * @module providers/auth/auth-provider.rest
 *
 * @description
 * Token-based Refine `AuthProvider` for the real Laravel + Sanctum backend.
 *
 * Flow:
 * 1. `login` POSTs credentials, receives a bearer token + user, stores the
 *    token in the shared {@link TokenStore}, and seeds the {@link session}.
 * 2. `check` gates protected routes on a valid, non-expired token.
 * 3. `getIdentity` / `getPermissions` read `/auth/me` (cached in the session).
 * 4. `onError` logs the user out on a `401`, so an expired/revoked token drops
 *    them to `/login` automatically.
 *
 * @see IDENTITY_AND_TENANCY_SPEC.md §4-5 (Sanctum tokens, auth core)
 */

import type { HttpClient } from "@/lib/http";
import type { TokenStore } from "@/lib/http";
import type { ApiResource, AuthTokenResponse, Identity, LoginCredentials } from "@/types";
import type { AuthUser } from "@/types";
import type { AuthProvider } from "@refinedev/core";

import { appRoutes } from "@/app/routes";
import { ApiError } from "@/lib/http";
import { toIdentity } from "@/providers/auth/map-identity";
import { setCurrentIdentity } from "@/providers/auth/session";

/** Configuration for {@link createRestAuthProvider}. */
export interface RestAuthProviderOptions {
  /** Path prefix for auth endpoints, e.g. `/api/v1` → `/api/v1/auth/login`. */
  apiPrefix?: string;
}

const DEFAULT_API_PREFIX = "/api/v1";

/** Wraps an unknown thrown value as an {@link ApiError} (Refine needs `Error`). */
function normalizeError(error: unknown, fallbackMessage: string): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 0);
  }

  return new ApiError(fallbackMessage, 0);
}

/**
 * Builds a token auth provider bound to a shared HTTP client + token store.
 *
 * @param client - HTTP client carrying the API origin and bearer header.
 * @param tokens - Shared token store (also read by the HTTP client).
 * @param options - Optional auth endpoint prefix override.
 */
export function createRestAuthProvider(
  client: HttpClient,
  tokens: TokenStore,
  options: RestAuthProviderOptions = {},
): AuthProvider {
  const prefix = options.apiPrefix ?? DEFAULT_API_PREFIX;

  /**
   * Loads the authenticated user from `/auth/me`, maps it to {@link Identity},
   * and refreshes the shared session cache. Returns `null` when unauthenticated.
   */
  async function resolveIdentity(): Promise<Identity | null> {
    if (!tokens.hasValidToken()) {
      setCurrentIdentity(null);

      return null;
    }

    const response = await client.get<ApiResource<AuthUser> | AuthUser>(`${prefix}/auth/me`);
    const user = "data" in response ? response.data : response;
    const identity = toIdentity(user);

    setCurrentIdentity(identity);

    return identity;
  }

  return {
    async login(params: LoginCredentials) {
      try {
        const response = await client.post<AuthTokenResponse>(`${prefix}/auth/login`, {
          email: params.email,
          password: params.password,
          device_name: params.device_name ?? "web",
        });

        tokens.setToken(response.token, response.expires_at);
        setCurrentIdentity(toIdentity(response.user));

        return { success: true, redirectTo: appRoutes.dashboard };
      } catch (error) {
        return {
          success: false,
          error: normalizeError(error, "Invalid email or password."),
        };
      }
    },

    async logout() {
      // Best-effort server-side token revocation; ignore failures so the client
      // always ends up signed out locally.
      try {
        await client.post(`${prefix}/auth/logout`);
      } catch {
        // Intentionally ignored — local cleanup below is what matters.
      }

      tokens.clearToken();
      setCurrentIdentity(null);

      return { success: true, redirectTo: appRoutes.login };
    },

    async check() {
      if (tokens.hasValidToken()) {
        return { authenticated: true };
      }

      return {
        authenticated: false,
        redirectTo: appRoutes.login,
        logout: true,
      };
    },

    async getIdentity() {
      try {
        return await resolveIdentity();
      } catch {
        // A failed `/me` (e.g. revoked token) surfaces as unauthenticated.
        return null;
      }
    },

    async getPermissions() {
      try {
        const identity = await resolveIdentity();

        return identity?.permissions ?? [];
      } catch {
        return [];
      }
    },

    async onError(error) {
      const statusCode = (error as { statusCode?: number })?.statusCode;

      if (statusCode === 401) {
        return { logout: true, redirectTo: appRoutes.login, error };
      }

      return { error };
    },
  };
}
