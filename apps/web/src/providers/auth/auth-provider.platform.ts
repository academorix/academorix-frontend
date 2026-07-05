/**
 * @file auth-provider.platform.ts
 * @module providers/auth/auth-provider.platform
 *
 * @description
 * Token-based Refine `AuthProvider` for the **platform admin** surface
 * (`admin.academorix.app`). Talks to the backend routes at
 * `/api/v1/platform/auth/*` — see PLAN.md §1.3 and the backend's
 * `modules/Auth/routes/platform.php`.
 *
 * Compared to the tenant provider:
 *
 * - Platform admins have **mandatory 2FA** — the login response may carry
 *   `two_factor_setup_required: true` (first login) or `two_factor_required:
 *   true` (subsequent logins, awaiting a challenge).
 * - Platform admins can **impersonate** any tenant user via a dedicated
 *   endpoint (returns a short-lived, ability-scoped tenant token that the SPA
 *   uses on the tenant host).
 * - Platform admins share the `platform_users` password broker (separate from
 *   the tenant `users` broker).
 * - Password reset does **not** issue a new token; the admin must log in again.
 */

import type { HostContext, HttpClient, TokenStore } from "@/lib/http";
import type {
  AuthTokenResponse,
  AuthUser,
  BackendUserData,
  Identity,
  LoginCredentials,
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
import { setCurrentIdentity } from "@/providers/auth/session";
import { isTwoFactorRequired } from "@/types";

/** Configuration for the platform provider factory. */
export interface PlatformAuthProviderOptions {
  /** Endpoint prefix; `/v1/platform/auth` on the platform surface (default). */
  authPrefix?: string;
  /** Endpoint for the identity bootstrap; `/v1/platform/auth/me` (default). */
  mePath?: string;
  /** The resolved host context (drives redirects). */
  host: HostContext;
}

/** Extra platform-only auth surface (2FA, impersonation, password step-up). */
export interface PlatformAuthApi {
  /** `POST .../two-factor/enable` — returns provisioning URL + secret. */
  enableTwoFactor(): Promise<TwoFactorEnableResponse>;
  /** `POST .../two-factor/confirm` — confirms enrolment, mints a full token. */
  confirmTwoFactor(code: string): Promise<AuthTokenResponse>;
  /** `POST .../two-factor/challenge` — redeems a code against a challenge token. */
  challengeTwoFactor(input: ChallengeInput): Promise<AuthTokenResponse>;
  /** `GET/POST .../two-factor/recovery-codes`. */
  getRecoveryCodes(): Promise<{ recovery_codes: string[] }>;
  regenerateRecoveryCodes(): Promise<{ recovery_codes: string[] }>;
  /** `POST .../confirm-password` — writes a step-up marker. */
  confirmPassword(password: string): Promise<{ confirmed: true }>;
  /** `POST .../change-password`. */
  changePassword(input: ChangePasswordInput): Promise<{ message: string }>;
  /** `POST .../forgot-password`. */
  forgotPassword(email: string): Promise<{ message: string }>;
  /** `POST .../reset-password`. */
  resetPassword(input: ResetPasswordInput): Promise<{ message: string }>;
  /** `POST .../impersonate` — starts an impersonation session. */
  startImpersonation(input: ImpersonateInput): Promise<AuthTokenResponse>;
}

/** `POST .../two-factor/enable` response body. */
export interface TwoFactorEnableResponse {
  /** SVG or QR code URL for the authenticator app. */
  qr_code_svg: string;
  /** The raw TOTP secret for manual entry. */
  secret: string;
}

/** Body accepted by the 2FA challenge endpoint (one of code / recovery). */
export interface ChallengeInput {
  challenge_token: string;
  code?: string;
  recovery_code?: string;
  device_name?: string;
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

/** Body accepted by the impersonation endpoint. */
export interface ImpersonateInput {
  tenant_id: string;
  tenant_user_id: string;
  ttl_minutes?: number;
  device_name?: string;
}

/** Wraps an unknown thrown value as an {@link ApiError}. */
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
 * Builds the platform auth provider + companion API. The provider covers the
 * Refine-visible flows (`login`/`logout`/`check`/`getIdentity`/`getPermissions`);
 * the companion API covers 2FA, impersonation, and step-up flows that the
 * dedicated admin pages call directly.
 */
export function createPlatformAuthProvider(
  client: HttpClient,
  tokens: TokenStore,
  options: PlatformAuthProviderOptions,
): { authProvider: AuthProvider; api: PlatformAuthApi } {
  const authPrefix = options.authPrefix ?? "/v1/platform/auth";
  const mePath = options.mePath ?? "/v1/platform/auth/me";
  const host = options.host;

  type MeResponse = { data: AuthUser } | AuthUser;

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
      // Fall through.
    }

    if (!fallback) {
      return null;
    }

    // Platform admins are not tenant-scoped; the placeholder tenant is
    // "Platform" so the shell can still render.
    const identity = synthesizeIdentityFromMinimalUser(
      fallback,
      placeholderTenantSummary(host.tenantSlug, "Platform"),
    );

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
          return {
            success: false,
            redirectTo: `/2fa/challenge?token=${encodeURIComponent(response.challenge_token)}`,
            error: new ApiError("Two-factor authentication required.", 401),
          };
        }

        tokens.setToken(response.access_token, response.expires_at);
        await resolveIdentity(response.user);

        // First-login enrolment: response.two_factor_setup_required === true
        // and the token's ability list is restricted to `two_factor_enable`.
        // The admin routes redirect straight to /2fa/setup in that case.
        if (response.two_factor_setup_required) {
          return { success: true, redirectTo: "/2fa/setup" };
        }

        return { success: true, redirectTo: appRoutes.dashboard };
      } catch (error) {
        return {
          success: false,
          error: normalizeError(error, "Invalid email or password."),
        };
      }
    },

    async logout() {
      try {
        await client.post(`${authPrefix}/logout`, undefined, { allowRefresh: false });
      } catch {
        // Intentionally ignored.
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

  const api: PlatformAuthApi = {
    async enableTwoFactor() {
      return client.post<TwoFactorEnableResponse>(`${authPrefix}/two-factor/enable`);
    },

    async confirmTwoFactor(code) {
      const response = await client.post<AuthTokenResponse>(`${authPrefix}/two-factor/confirm`, {
        code,
      });

      // Confirm returns a fresh full-abilities token; swap the caller's
      // restricted enrolment token for it.
      tokens.setToken(response.access_token, response.expires_at);
      await resolveIdentity(response.user);

      return response;
    },

    async challengeTwoFactor(input) {
      const response = await client.post<AuthTokenResponse>(
        `${authPrefix}/two-factor/challenge`,
        input,
        { allowRefresh: false },
      );

      tokens.setToken(response.access_token, response.expires_at);
      await resolveIdentity(response.user);

      return response;
    },

    async getRecoveryCodes() {
      return client.get<{ recovery_codes: string[] }>(`${authPrefix}/two-factor/recovery-codes`);
    },

    async regenerateRecoveryCodes() {
      return client.post<{ recovery_codes: string[] }>(`${authPrefix}/two-factor/recovery-codes`);
    },

    async confirmPassword(password) {
      return client.post<{ confirmed: true }>(`${authPrefix}/confirm-password`, { password });
    },

    async changePassword(input) {
      return client.post<{ message: string }>(`${authPrefix}/change-password`, input);
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

      tokens.clearToken();
      setCurrentIdentity(null);

      return result;
    },

    async startImpersonation(input) {
      return client.post<AuthTokenResponse>(`${authPrefix}/impersonate`, input);
    },
  };

  return { authProvider, api };
}
