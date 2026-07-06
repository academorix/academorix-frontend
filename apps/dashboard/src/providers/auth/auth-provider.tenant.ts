/**
 * @file auth-provider.tenant.ts
 * @module providers/auth/auth-provider.tenant
 *
 * @description
 * Token-based Refine `AuthProvider` for the **tenant** surface (`{slug}.academorix.app`).
 * Talks to the backend routes at `/api/auth/*` — see PLAN.md §1.3 and the
 * backend's `modules/Auth/routes/tenant.php`.
 *
 * Endpoint mapping:
 *
 * | Refine method   | HTTP call                                   |
 * |-----------------|---------------------------------------------|
 * | `login`         | `POST /auth/login`                          |
 * | `logout`        | `POST /auth/logout`                         |
 * | `check`         | (token store — no round-trip)               |
 * | `getIdentity`   | `GET /auth/me` (fallback: synth from login DTO) |
 * | `getPermissions`| (cached from `getIdentity`)                 |
 * | `onError`       | 401 → logout                                |
 *
 * The provider also exposes non-Refine methods (`register`, `forgotPassword`,
 * `resetPassword`, `sendEmailVerification`, `confirmPassword`, `changePassword`)
 * on a companion object returned by {@link buildTenantAuthApi} — used directly
 * by the auth pages that are outside Refine's `useLogin`/`useLogout` surface.
 */

import type { HostContext, HttpClient, TokenStore } from "@/lib/http";
import type {
  AuthTokenResponse,
  AuthUser,
  BackendUserData,
  Identity,
  LoginCredentials,
  TenantSummary,
  TwoFactorRequiredResponse,
} from "@/types";
import type { AuthProvider } from "@refinedev/core";

import { ApiError } from "@/lib/http";
import { appRoutes } from "@/lib/module";
import {
  placeholderTenantSummary,
  synthesizeIdentityFromMinimalUser,
  toIdentity,
} from "@/providers/auth/map-identity";
import { getImpersonation, setCurrentIdentity } from "@/providers/auth/session";
import { isTwoFactorRequired } from "@/types";

/** Configuration for the tenant provider factory. */
export interface TenantAuthProviderOptions {
  /** Endpoint prefix; `/auth` on the tenant surface (default). */
  authPrefix?: string;
  /** Endpoint for the identity bootstrap; `/auth/me` (default). */
  mePath?: string;
  /** The resolved host context (drives placeholder tenant + redirects). */
  host: HostContext;
}

/** Extra auth surface used by dedicated auth pages (not Refine hooks). */
export interface TenantAuthApi {
  /** `POST /auth/register` — never returns a token; caller must sign in. */
  register(input: RegisterInput): Promise<BackendUserData>;
  /** `POST /auth/forgot-password` — always resolves; never leaks existence. */
  forgotPassword(email: string): Promise<{ message: string }>;
  /** `POST /auth/reset-password`. */
  resetPassword(input: ResetPasswordInput): Promise<{ message: string }>;
  /** `POST /auth/email/verification-notification`. */
  sendEmailVerification(): Promise<{ message: string }>;
  /** `GET /auth/email/verify` — reports whether the current caller is verified. */
  getVerificationStatus(): Promise<{ verified: boolean; email: string }>;
  /** `POST /auth/confirm-password` — writes a step-up marker. */
  confirmPassword(password: string): Promise<{ confirmed: true }>;
  /** `POST /auth/change-password`. */
  changePassword(input: ChangePasswordInput): Promise<{ message: string }>;
}

/** Register form input. */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/** Reset-password form input. */
export interface ResetPasswordInput {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/** Change-password form input. */
export interface ChangePasswordInput {
  current_password: string;
  password: string;
  password_confirmation: string;
}

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

/** Wraps the backend's `AuthUser` envelope: `{ data: user }` or bare user. */
type MeResponse = { data: AuthUser } | AuthUser;

/**
 * Builds the tenant auth provider + companion API. Two return values because
 * Refine's `AuthProvider` interface is intentionally narrow — the extra flows
 * (register / password reset / email verify / step-up) live alongside.
 */
export function createTenantAuthProvider(
  client: HttpClient,
  tokens: TokenStore,
  options: TenantAuthProviderOptions,
): { authProvider: AuthProvider; api: TenantAuthApi } {
  const authPrefix = options.authPrefix ?? "/auth";
  const mePath = options.mePath ?? "/auth/me";
  const host = options.host;

  /**
   * Fetches the rich identity from `GET /auth/me`. Returns `null` when the
   * endpoint has not shipped yet (PLAN.md gap G1) so callers can fall back to
   * a synthesized identity built from the login DTO.
   */
  async function fetchRichIdentity(): Promise<AuthUser | null> {
    try {
      const response = await client.get<MeResponse>(mePath);

      return "data" in response ? response.data : response;
    } catch (caught) {
      if (caught instanceof ApiError && caught.statusCode === 404) {
        return null;
      }

      throw caught;
    }
  }

  /**
   * Fetches the current tenant summary from `GET /current-tenant`. Falls back
   * to a synthesized placeholder when the endpoint is unreachable so login
   * still completes.
   */
  async function fetchTenantSummary(): Promise<TenantSummary> {
    try {
      const response = await client.get<{ data: TenantSummary } | TenantSummary>("/current-tenant");

      return "data" in response ? response.data : response;
    } catch {
      return placeholderTenantSummary(host.tenantSlug, "Your Workspace");
    }
  }

  /**
   * Resolves the app's identity from whatever the backend gives us today:
   *
   * 1. If `/auth/me` responds, map it directly (rich).
   * 2. Otherwise, if we have any stored token, synth a minimal identity
   *    (empty roles/permissions/features) so the shell still renders and RBAC
   *    fails open until the endpoint lands.
   * 3. If nothing works, return `null` (unauthenticated).
   */
  async function resolveIdentity(fallback?: BackendUserData): Promise<Identity | null> {
    if (!tokens.hasValidToken()) {
      setCurrentIdentity(null);

      return null;
    }

    try {
      const richUser = await fetchRichIdentity();

      if (richUser) {
        const identity = toIdentity(richUser);

        setCurrentIdentity(identity);

        return identity;
      }
    } catch {
      // Fall through to synth path.
    }

    if (!fallback) {
      return null;
    }

    const tenant = await fetchTenantSummary();
    const identity = synthesizeIdentityFromMinimalUser(fallback, tenant);

    setCurrentIdentity(identity);

    return identity;
  }

  const authProvider: AuthProvider = {
    async login(params: LoginCredentials) {
      try {
        const response = await client.post<AuthTokenResponse | TwoFactorRequiredResponse>(
          `${authPrefix}/login`,
          {
            email: params.email,
            password: params.password,
            device_name: params.device_name ?? "web",
          },
          { allowRefresh: false },
        );

        if (isTwoFactorRequired(response)) {
          // Tenant 2FA is stubbed on the backend today (returns 501). This
          // branch is kept for forward-compatibility once gap G9 lands.
          return {
            success: false,
            redirectTo: `/2fa/challenge?token=${encodeURIComponent(response.challenge_token)}`,
            error: new ApiError("Two-factor authentication required.", 401),
          };
        }

        tokens.setToken(response.access_token, response.expires_at);
        await resolveIdentity(response.user);

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
        await client.post(`${authPrefix}/logout`, undefined, { allowRefresh: false });
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

  const api: TenantAuthApi = {
    async register(input) {
      const response = await client.post<{ data: BackendUserData } | BackendUserData>(
        `${authPrefix}/register`,
        input,
        { allowRefresh: false },
      );

      return "data" in response ? response.data : response;
    },

    async forgotPassword(email) {
      return client.post<{ message: string }>(
        `${authPrefix}/forgot-password`,
        { email },
        { allowRefresh: false },
      );
    },

    async resetPassword(input) {
      const result = await client.post<{ message: string }>(`${authPrefix}/reset-password`, input, {
        allowRefresh: false,
      });

      // Backend revokes every token on successful reset; the client mirrors
      // this so the presenting session drops any stale in-memory state.
      tokens.clearToken();
      setCurrentIdentity(null);

      return result;
    },

    async sendEmailVerification() {
      return client.post<{ message: string }>(`${authPrefix}/email/verification-notification`);
    },

    async getVerificationStatus() {
      return client.get<{ verified: boolean; email: string }>(`${authPrefix}/email/verify`);
    },

    async confirmPassword(password) {
      return client.post<{ confirmed: true }>(`${authPrefix}/confirm-password`, {
        password,
      });
    },

    async changePassword(input) {
      return client.post<{ message: string }>(`${authPrefix}/change-password`, input);
    },
  };

  // Expose the current impersonation state on the singleton so pages can
  // render banners without importing session directly (they can). We keep the
  // getter here for cohesion with the auth surface.
  void getImpersonation;

  return { authProvider, api };
}
