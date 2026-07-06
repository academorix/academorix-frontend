/**
 * @file index.ts
 * @module providers/auth
 *
 * @description
 * Selects the active Refine {@link AuthProvider} by host at boot time:
 *
 * - Central admin host (e.g. {@code admin.academorix.app}) →
 *   {@link createPlatformAuthProvider}, targeting
 *   {@code POST /api/v1/platform/auth/*}.
 * - Anything else (tenant subdomain, custom domain, local dev) →
 *   {@link createTenantAuthProvider}, targeting {@code POST /api/auth/*}.
 *
 * Both providers share the same {@link tokenStore} and identity cache, so
 * the rest of the app is agnostic to which one is live.
 *
 * The tenant and platform surfaces also expose a companion **API** object
 * ({@link tenantAuthApi} / {@link platformAuthApi}) carrying the extra
 * flows Refine's {@link AuthProvider} interface does not cover — register,
 * password reset, email verification, MFA / step-up, impersonation. Auth
 * pages import these directly (Refine handles {@code useLogin} /
 * {@code useLogout}; the rest is called by hand).
 */

import type { AuthProvider } from "@refinedev/core";

import { httpClient, resolveHostContext, tokenStore } from "@/lib/http";
import {
  createPlatformAuthProvider,
  type PlatformAuthApi,
} from "@/providers/auth/auth-provider.platform";
import {
  createTenantAuthProvider,
  type TenantAuthApi,
} from "@/providers/auth/auth-provider.tenant";

const host = resolveHostContext();

/**
 * Builds the active auth provider + its companion API for the current
 * host. Exactly one of {@code tenantApi} / {@code platformApi} is
 * non-null; the other is {@code null} to let callers feature-detect
 * with a straightforward {@code if (tenantAuthApi) { … }}.
 */
function buildAuthProviders(): {
  authProvider: AuthProvider;
  tenantApi: TenantAuthApi | null;
  platformApi: PlatformAuthApi | null;
} {
  if (host.kind === "central-admin") {
    const { authProvider, api } = createPlatformAuthProvider(httpClient, tokenStore, { host });

    return { authProvider, tenantApi: null, platformApi: api };
  }

  // Tenant (subdomain, custom domain, local dev, or a central host that
  // renders the workspace picker — the picker never logs in, but the
  // provider is still needed to answer {@code check} / {@code getIdentity}).
  const { authProvider, api } = createTenantAuthProvider(httpClient, tokenStore, { host });

  return { authProvider, tenantApi: api, platformApi: null };
}

const providers = buildAuthProviders();

/** The auth provider Refine uses for this session. */
export const authProvider: AuthProvider = providers.authProvider;

/**
 * Extra tenant flows (register / password reset / email verify / step-up /
 * change-password). {@code null} when the app booted the platform-admin
 * surface. Auth pages should feature-detect via
 * {@code if (tenantAuthApi) { … }} before calling.
 */
export const tenantAuthApi: TenantAuthApi | null = providers.tenantApi;

/**
 * Extra platform flows (MFA enrol/confirm/challenge/recovery,
 * impersonation, step-up, change-password). {@code null} on the tenant
 * surface.
 */
export const platformAuthApi: PlatformAuthApi | null = providers.platformApi;

export { createPlatformAuthProvider } from "@/providers/auth/auth-provider.platform";
export { createTenantAuthProvider } from "@/providers/auth/auth-provider.tenant";
export type {
  PlatformAuthApi,
  TwoFactorEnableResponse,
} from "@/providers/auth/auth-provider.platform";
export type { TenantAuthApi } from "@/providers/auth/auth-provider.tenant";
export * from "@/providers/auth/session";
export * from "@/providers/auth/password-policy";
