/**
 * @file auth-provider.mock.ts
 * @module providers/auth/auth-provider.mock
 *
 * @description
 * Mock Refine `AuthProvider` used when `VITE_API_MOCK` is on. It mirrors the
 * real backend's contract (same login DTO shape, same envelope semantics) so
 * screens behave identically in both modes.
 *
 * ## Multi-persona RBAC demo
 * The mock backend ships a **roster of demo users** in
 * `public/data/demo-users.json` (owner, admin, head coach, coach, reception,
 * finance, medical officer) — each with a distinct role, permission set, and
 * feature list. `login` resolves the persona by the entered **email**, so the
 * whole app (nav, action buttons, `<CanAccess>` guards) reflects that user's
 * authorization. The chosen persona is persisted in `localStorage` so a reload
 * keeps you signed in as the same user. Any non-empty password is accepted.
 *
 * If the roster is unavailable, the provider falls back to the single
 * `me.json` fixture (the owner), preserving the original behaviour.
 */

import type { TokenStore } from "@/lib/http";
import type { AuthUser, Identity, LoginCredentials } from "@/types";
import type { AuthProvider } from "@refinedev/core";

import { ApiError } from "@/lib/http";
import { appRoutes } from "@/lib/module";
import { toIdentity } from "@/providers/auth/map-identity";
import { setCurrentIdentity } from "@/providers/auth/session";

/** Configuration for {@link createMockAuthProvider}. */
export interface MockAuthProviderOptions {
  /** Public path the fixtures live under. Defaults to `/data`. */
  basePath?: string;
}

const DEFAULT_BASE_PATH = "/data";

/** `localStorage` key holding the active demo persona's email across reloads. */
const PERSONA_STORAGE_KEY = "academorix.mock.persona";

/** Reads the persisted active-persona email, if any. */
function readActivePersonaEmail(): string | null {
  try {
    return window.localStorage.getItem(PERSONA_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Persists (or clears, with `null`) the active-persona email. */
function writeActivePersonaEmail(email: string | null): void {
  try {
    if (email) {
      window.localStorage.setItem(PERSONA_STORAGE_KEY, email);
    } else {
      window.localStorage.removeItem(PERSONA_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors (private mode / disabled storage).
  }
}

/**
 * Builds a mock auth provider that authenticates against JSON identity
 * fixtures (a multi-persona roster) instead of a real backend.
 *
 * @param tokens - Shared token store (a fake token is stored on login).
 * @param options - Optional fixtures base path override.
 */
export function createMockAuthProvider(
  tokens: TokenStore,
  options: MockAuthProviderOptions = {},
): AuthProvider {
  const basePath = (options.basePath ?? DEFAULT_BASE_PATH).replace(/\/+$/, "");

  /** Loads the demo-user roster; returns `[]` when the fixture is absent. */
  async function loadRoster(): Promise<AuthUser[]> {
    try {
      const response = await fetch(`${basePath}/demo-users.json`);

      if (!response.ok) {
        return [];
      }

      const payload: unknown = await response.json();

      return Array.isArray(payload) ? (payload as AuthUser[]) : [];
    } catch {
      return [];
    }
  }

  /** Loads the single owner fixture (fallback when the roster is unavailable). */
  async function loadOwnerFixture(): Promise<AuthUser> {
    const response = await fetch(`${basePath}/me.json`);

    if (!response.ok) {
      throw new ApiError(`Mock identity fixture missing (${basePath}/me.json).`, response.status);
    }

    const payload: unknown = await response.json();

    return (
      "data" in (payload as object) ? (payload as { data: AuthUser }).data : payload
    ) as AuthUser;
  }

  /**
   * Picks a persona from the roster: the one matching `email`, else the owner,
   * else the first entry.
   */
  function resolvePersona(roster: AuthUser[], email: string | null): AuthUser | null {
    if (roster.length === 0) {
      return null;
    }

    if (email) {
      const match = roster.find((user) => user.email.toLowerCase() === email.toLowerCase());

      if (match) {
        return match;
      }
    }

    return roster.find((user) => user.roles.includes("owner")) ?? roster[0] ?? null;
  }

  /** Resolves the active {@link AuthUser} for the given (optional) email. */
  async function loadUser(email: string | null): Promise<AuthUser> {
    const roster = await loadRoster();
    const persona = resolvePersona(roster, email);

    return persona ?? (await loadOwnerFixture());
  }

  /** Loads the active persona, maps it to an identity, and seeds the session. */
  async function resolveIdentity(): Promise<Identity | null> {
    if (!tokens.hasValidToken()) {
      setCurrentIdentity(null);

      return null;
    }

    const identity = toIdentity(await loadUser(readActivePersonaEmail()));

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
        // Resolve the persona from the entered email (drives RBAC everywhere).
        const user = await loadUser(params.email);

        // Any non-empty credentials succeed in mock mode. The token shape
        // mirrors the real backend's Sanctum PAT format for realism.
        tokens.setToken(`mock-token.${Date.now().toString(36)}`, null);
        writeActivePersonaEmail(user.email);
        setCurrentIdentity(toIdentity(user));

        return { success: true, redirectTo: appRoutes.dashboard };
      } catch (error) {
        return {
          success: false,
          error: error instanceof ApiError ? error : new ApiError("Mock login failed.", 0),
        };
      }
    },

    async logout() {
      tokens.clearToken();
      writeActivePersonaEmail(null);
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
