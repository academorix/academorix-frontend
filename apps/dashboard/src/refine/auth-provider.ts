/**
 * @file auth-provider.ts
 * @module refine/auth-provider
 *
 * @description
 * Refine `AuthProvider` implementation backed by the Laravel Sanctum PAT flow.
 *
 * ## Contract
 *
 * The provider owns four responsibilities:
 *
 *   1. **`login`** — POSTs to `/api/auth/login`, handles the 2FA branch by
 *      returning a redirect envelope, and on success persists the bearer
 *      token via {@link writeAuthToken} + refreshes the cached identity.
 *   2. **`logout`** — POSTs to `/api/auth/logout` (best-effort — a failed
 *      server call still tears down the local token so the user isn't
 *      trapped) and clears every auth-related localStorage key.
 *   3. **`check`** — the authentication predicate Refine's route guards
 *      call. Reads the local token, verifies it has not expired
 *      client-side, and — when missing — returns an "unauthenticated"
 *      envelope with a redirect target so `<Authenticated>` bounces the
 *      user to `/sign-in`.
 *   4. **`getIdentity`** / **`getPermissions`** — read the identity from
 *      {@link getIdentitySnapshot}, which lazily hydrates via
 *      `GET /api/auth/me` on first read.
 *
 * ## Fixture fallback
 *
 * When `VITE_APP_ENV === "local"` and no token is stored, the identity
 * store falls back to the JSON fixture. That keeps the frontend dev
 * loop free of a backend dependency — component work / storybook /
 * design QA all run without a running Laravel. The moment a real
 * login lands, the fixture is replaced with the server payload.
 *
 * ## Mock auth
 *
 * When {@link MOCK_AUTH_ENABLED} is true (local / dev builds) the
 * provider intercepts every backend call — {@link login} accepts
 * arbitrary credentials, {@link logout} skips the API call, and
 * {@link completeLogin} skips the `/me` refetch. The identity store's
 * fixture-fallback then paints the shell with the demo user from
 * `data/current-user.json`. Ship the frontend without a running
 * Laravel; a real backend takes over the moment `VITE_APP_ENV`
 * flips to anything other than `local`.
 */

import type { AuthProvider } from "@refinedev/core";

import { authApi, type LoginResult, type TwoFactorRequiredResponse } from "@/lib/api/auth-api";
import { ApiError } from "@/lib/api/http-client";
import { clearAuthToken, writeAuthToken, writeCachedUser } from "@/lib/auth/token-store";

import {
  clearIdentity,
  getIdentitySnapshot,
  hydrateIdentityFromCache,
  isAuthenticated,
  refreshIdentity,
} from "./identity-store";

/** A single menu entry in the user dropdown. */
export type UserMenuEntry = {
  id: string;
  label: string;
  icon: string;
  href?: string;
  external?: boolean;
  variant?: "danger";
  action?: "sign-out";
  shortcut?: string;
};

/** A workspace / branch the user has access to (branch switcher). */
export type UserBranchEntry = {
  id: string;
  name: string;
  city?: string;
};

/** The identity the shell reads to filter sidebar / palette + label the user menu. */
export type Identity = {
  id: string;
  name: string;
  email: string;
  initials: string;
  avatarUrl?: string | null;
  role?: string;
  workspace?: {
    id: string;
    name: string;
    plan?: string;
    region?: string;
    activeBranchId?: string;
    activeBranchName?: string;
  };
  branches?: UserBranchEntry[];
  /** Enabled tenant features. Empty array = fail-open (show everything). */
  features: string[];
  /** Granted permissions. `"*"` = superuser. */
  permissions: string[];
  /** Per-resource terminology overrides (e.g. `{athletes: "Students"}`). */
  terminology?: Record<string, string>;
  /** Menu entries rendered in the navbar user dropdown. */
  menu?: UserMenuEntry[];
};

/**
 * Envelope returned to Refine's `login()` when the account needs a 2FA
 * challenge. Refine calls `redirectTo` at the end of the login pass,
 * so we surface the challenge URL there — the sign-in page also
 * receives the challenge token via a router-state hand-off so the
 * challenge form can present without a fresh 401.
 */
export interface TwoFactorRedirect {
  success: true;
  redirectTo: string;
  successNotification?: {
    message: string;
    description?: string;
  };
  /**
   * Extra state — Refine passes the whole return value into
   * `useLogin` mutation `data`, so this is where the sign-in page's
   * 2FA branch reads the challenge token from.
   */
  twoFactor: TwoFactorRequiredResponse;
}

/**
 * Discriminant used by consumers to detect the 2FA branch of `login()`.
 * Refine's type is deliberately loose (`{success: boolean, ...}`) so
 * we tighten it with a helper the sign-in page can call.
 */
export function isTwoFactorRedirect(result: unknown): result is TwoFactorRedirect {
  return (
    typeof result === "object" &&
    result !== null &&
    "twoFactor" in result &&
    (result as Record<string, unknown>).success === true
  );
}

/**
 * Login payload accepted by `login({email, password, ...})`. Kept as
 * a superset of the API request so the SPA can attach the "Remember
 * this device" toggle in a future iteration without breaking the API
 * contract.
 */
export interface LoginInput {
  email: string;
  password: string;
  /** Optional label persisted on the Sanctum PAT (default: "Web session"). */
  deviceName?: string;
  /** Optional route to bounce to after success (falls back to `/dashboard`). */
  redirectTo?: string;
}

// ---------------------------------------------------------------------------
// Mock auth
// ---------------------------------------------------------------------------

/**
 * Whether the provider should skip the backend and mint a synthetic
 * session. Enabled whenever the dashboard runs in `local`-flavoured
 * builds — production builds always fall through to the real Sanctum
 * endpoints regardless of what this file says.
 */
const MOCK_AUTH_ENABLED =
  (import.meta.env.VITE_APP_ENV as string | undefined) === "local" || import.meta.env.DEV;

/**
 * Convenience credentials displayed in dev — advertised on the
 * sign-in page (see {@link MOCK_AUTH_HINT}) so a designer new to the
 * repo can log in without spelunking through the source.
 */
export const MOCK_AUTH_CREDENTIALS = {
  email: "alex@academorix.demo",
  password: "password",
} as const;

/**
 * Human-facing hint the sign-in page renders when {@link MOCK_AUTH_ENABLED}
 * is on. Exported so the UI can present the exact strings the mock
 * accepts.
 */
export const MOCK_AUTH_HINT = `Any credentials work in dev — try ${MOCK_AUTH_CREDENTIALS.email} / ${MOCK_AUTH_CREDENTIALS.password}.`;

/** TTL of the synthetic bearer token minted by {@link mockLogin}. */
const MOCK_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Simulate a short network round-trip so the sign-in form's pending
 * state has a chance to render. Without this the mock resolves on the
 * next microtask, which flashes the submit button in a jarring way.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Synthetic login. Accepts anything with a non-empty email + password
 * so a designer trialling the shell doesn't have to remember an
 * arbitrary demo credential. Persists a fake bearer token so
 * {@link authProvider.check} returns authenticated on the next tick.
 */
async function mockLogin(
  input: LoginInput,
): Promise<
  | { success: true; redirectTo: string }
  | { success: false; error: { message: string; name: string } }
> {
  await delay(180);

  const email = input.email.trim();
  const password = input.password;

  if (!email || !password) {
    return {
      success: false,
      error: {
        message: "Sign in failed",
        name: "Enter an email address and password to continue.",
      },
    };
  }

  writeAuthToken({
    accessToken: `dev-mock-token-${Date.now()}`,
    expiresAt: new Date(Date.now() + MOCK_TOKEN_TTL_MS).toISOString(),
  });

  // Skip `writeCachedUser` — the identity store's local-dev fallback
  // already paints the shell from `data/current-user.json` when no
  // cache is present. Writing a cached copy would force the real
  // `mapMePayload` translator to run against the fixture and drop
  // camelCase fields the mapper only expects in snake_case.

  return {
    success: true,
    redirectTo: input.redirectTo ?? "/dashboard",
  };
}

// ---------------------------------------------------------------------------
// Real (backend-backed) login
// ---------------------------------------------------------------------------

/**
 * Handle the raw login response — persist the token, seed the cached
 * user, and refresh the identity snapshot. Returns the frontend-facing
 * envelope for {@link authProvider.login}.
 *
 * Extracted so the 2FA challenge success path can reuse it without
 * duplicating the persistence steps.
 */
async function completeLogin(
  result: LoginResult,
  redirectTo: string,
): Promise<TwoFactorRedirect | { success: true; redirectTo: string }> {
  if ("two_factor_required" in result && result.two_factor_required) {
    // 2FA branch — no token yet. Bounce to the challenge page with the
    // challenge token in router state so the form can submit it.
    return {
      success: true,
      redirectTo: "/two-factor-challenge",
      twoFactor: result,
    };
  }

  writeAuthToken({
    accessToken: result.access_token,
    expiresAt: result.expires_at,
  });
  writeCachedUser(result.user);

  // Fetch the full identity manifest — the login payload's `user`
  // is intentionally slim (id / name / email / avatar) and we need
  // permissions + features + workspace before the shell can render
  // correctly. `refreshIdentity` handles a network failure by
  // falling back to the login payload so the redirect still lands.
  try {
    await refreshIdentity();
  } catch {
    // A failed `/me` fetch shouldn't block a fresh sign-in — the
    // shell will retry on next mount and the cached user gives us
    // enough to paint the shell.
  }

  return { success: true, redirectTo };
}

export const authProvider: AuthProvider = {
  async login(input: LoginInput) {
    // ------- Mock branch (local dev) -----------------------------------
    if (MOCK_AUTH_ENABLED) {
      return mockLogin(input);
    }

    // ------- Real backend flow -----------------------------------------
    const redirectTarget = input.redirectTo ?? "/dashboard";

    try {
      const result = await authApi.login({
        email: input.email,
        password: input.password,
        device_name: input.deviceName ?? "Web session",
      });

      return await completeLogin(result, redirectTarget);
    } catch (caught) {
      const message =
        caught instanceof ApiError
          ? caught.message
          : "We couldn't sign you in. Please check your credentials and try again.";

      return {
        success: false,
        error: {
          message: "Sign in failed",
          name: message,
        },
      };
    }
  },

  async logout() {
    if (!MOCK_AUTH_ENABLED) {
      try {
        await authApi.logout();
      } catch {
        // Failed logout on the server side — still tear down the
        // local session so the user isn't trapped by a stuck server.
      }
    }

    clearAuthToken();
    clearIdentity();

    return {
      success: true,
      redirectTo: "/sign-in",
    };
  },

  async check() {
    if (isAuthenticated()) {
      // Token still present + not expired. Kick off a background
      // identity hydration if we haven't already — `hydrateIdentityFromCache`
      // is a no-op once identity is resolved.
      hydrateIdentityFromCache();

      return { authenticated: true };
    }

    return {
      authenticated: false,
      redirectTo: "/sign-in",
      logout: false,
    };
  },

  async onError(error) {
    // Mock auth never yields 401s — surfacing one here would nuke the
    // synthetic session that lets the app run without a backend.
    if (MOCK_AUTH_ENABLED) {
      return {};
    }

    if (error instanceof ApiError && error.status === 401) {
      clearAuthToken();
      clearIdentity();

      return {
        logout: true,
        redirectTo: "/sign-in",
      };
    }

    return {};
  },

  async getIdentity() {
    return getIdentitySnapshot();
  },

  async getPermissions() {
    return getIdentitySnapshot().permissions;
  },
};
