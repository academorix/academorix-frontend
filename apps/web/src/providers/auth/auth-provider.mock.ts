/**
 * @file auth-provider.mock.ts
 * @module providers/auth/auth-provider.mock
 *
 * @description
 * Mock Refine `AuthProvider` used when `VITE_API_MOCK` is on. It mirrors the
 * REST provider's contract exactly (same methods, same redirects, same session
 * seeding) so screens behave identically in both modes.
 *
 * Behaviour:
 * - `login` accepts **any non-empty** email + password and mints a fake bearer
 *   token, then seeds the session from `public/data/me.json`. (The login screen
 *   surfaces this so developers know any credentials work in mock mode.)
 * - `getIdentity` / `getPermissions` read that same fixture.
 * - `check` / `onError` behave exactly like the REST provider.
 */

import type { TokenStore } from "@/lib/http";
import type { AuthUser, Identity, LoginCredentials } from "@/types";
import type { AuthProvider } from "@refinedev/core";

import { routes } from "@/config/routes";
import { ApiError } from "@/lib/http";
import { toIdentity } from "@/providers/auth/map-identity";
import { setCurrentIdentity } from "@/providers/auth/session";

/** Configuration for {@link createMockAuthProvider}. */
export interface MockAuthProviderOptions {
  /** Public path the fixtures live under. Defaults to `/data`. */
  basePath?: string;
}

const DEFAULT_BASE_PATH = "/data";

/**
 * Builds a mock auth provider that authenticates against a JSON identity
 * fixture instead of a real backend.
 *
 * @param tokens - Shared token store (a fake token is stored on login).
 * @param options - Optional fixtures base path override.
 */
export function createMockAuthProvider(
  tokens: TokenStore,
  options: MockAuthProviderOptions = {},
): AuthProvider {
  const basePath = (options.basePath ?? DEFAULT_BASE_PATH).replace(/\/+$/, "");

  /** Loads and unwraps the mock authenticated user fixture. */
  async function loadMockUser(): Promise<AuthUser> {
    const response = await fetch(`${basePath}/me.json`);

    if (!response.ok) {
      throw new ApiError(`Mock identity fixture missing (${basePath}/me.json).`, response.status);
    }

    const payload: unknown = await response.json();

    return (
      "data" in (payload as object) ? (payload as { data: AuthUser }).data : payload
    ) as AuthUser;
  }

  /** Loads the fixture, maps it to an identity, and seeds the session cache. */
  async function resolveIdentity(): Promise<Identity | null> {
    if (!tokens.hasValidToken()) {
      setCurrentIdentity(null);

      return null;
    }

    const identity = toIdentity(await loadMockUser());

    setCurrentIdentity(identity);

    return identity;
  }

  return {
    async login(params: LoginCredentials) {
      if (!params.email || !params.password) {
        return {
          success: false,
          error: new ApiError("Enter an email and password to continue.", 422),
        };
      }

      try {
        const user = await loadMockUser();

        // Any non-empty credentials succeed in mock mode.
        tokens.setToken(`mock-token.${Date.now().toString(36)}`, null);
        setCurrentIdentity(toIdentity(user));

        return { success: true, redirectTo: routes.dashboard };
      } catch (error) {
        return {
          success: false,
          error: error instanceof ApiError ? error : new ApiError("Mock login failed.", 0),
        };
      }
    },

    async logout() {
      tokens.clearToken();
      setCurrentIdentity(null);

      return { success: true, redirectTo: routes.login };
    },

    async check() {
      if (tokens.hasValidToken()) {
        return { authenticated: true };
      }

      return {
        authenticated: false,
        redirectTo: routes.login,
        logout: true,
      };
    },

    async getIdentity() {
      try {
        return await resolveIdentity();
      } catch {
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
        return { logout: true, redirectTo: routes.login, error };
      }

      return { error };
    },
  };
}
