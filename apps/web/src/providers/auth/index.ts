/**
 * @file index.ts
 * @module providers/auth
 *
 * @description
 * Selects the active auth provider by host + env (see PLAN.md §4.4):
 *
 * - `VITE_API_MOCK=true` → {@link createMockAuthProvider} (JSON fixtures).
 * - Central admin host → {@link createPlatformAuthProvider}.
 * - Anything else (tenant subdomain, custom domain, dev) →
 *   {@link createTenantAuthProvider}.
 *
 * All three share the same {@link tokenStore} and identity cache, so the rest
 * of the app is agnostic to which one is live.
 *
 * The tenant and platform surfaces also expose a companion **API** object
 * ({@link tenantAuthApi} / {@link platformAuthApi}) carrying the extra flows
 * Refine's `AuthProvider` interface doesn't cover — register, password reset,
 * email verification, 2FA, impersonation. Auth pages import these directly
 * (Refine handles `useLogin`/`useLogout`; the rest is called by hand).
 */

import type { AuthProvider } from "@refinedev/core";

import { env } from "@/config/env";
import { httpClient, resolveHostContext, tokenStore } from "@/lib/http";
import { createMockAuthProvider } from "@/providers/auth/auth-provider.mock";
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
 * The active auth provider and (for real backends) its companion API. In mock
 * mode `tenantApi` / `platformApi` are `null` because the mock provider does
 * not model those flows.
 */
function buildAuthProviders(): {
  authProvider: AuthProvider;
  tenantApi: TenantAuthApi | null;
  platformApi: PlatformAuthApi | null;
} {
  if (env.VITE_API_MOCK) {
    return {
      authProvider: createMockAuthProvider(tokenStore),
      tenantApi: null,
      platformApi: null,
    };
  }

  if (host.kind === "central-admin") {
    const { authProvider, api } = createPlatformAuthProvider(httpClient, tokenStore, { host });

    return { authProvider, tenantApi: null, platformApi: api };
  }

  // Tenant (subdomain, custom domain, dev localhost, central-that-picks-a-workspace).
  const { authProvider, api } = createTenantAuthProvider(httpClient, tokenStore, { host });

  return { authProvider, tenantApi: api, platformApi: null };
}

const providers = buildAuthProviders();

/** The auth provider Refine will use for this session. */
export const authProvider: AuthProvider = providers.authProvider;

/**
 * Extra tenant flows (register / password reset / email verify / step-up /
 * change-password). `null` when we booted the platform admin surface or when
 * `VITE_API_MOCK=true`. Auth pages should feature-detect via
 * `if (tenantAuthApi) { … }` before calling.
 */
export const tenantAuthApi: TenantAuthApi | null = providers.tenantApi;

/**
 * Extra platform flows (2FA enrol/confirm/challenge/recovery, impersonation,
 * step-up, change-password). `null` on the tenant surface / mock mode.
 */
export const platformAuthApi: PlatformAuthApi | null = providers.platformApi;

export { createMockAuthProvider } from "@/providers/auth/auth-provider.mock";
export { createPlatformAuthProvider } from "@/providers/auth/auth-provider.platform";
export { createTenantAuthProvider } from "@/providers/auth/auth-provider.tenant";
export type {
  PlatformAuthApi,
  TwoFactorEnableResponse,
} from "@/providers/auth/auth-provider.platform";
export type { TenantAuthApi } from "@/providers/auth/auth-provider.tenant";
export * from "@/providers/auth/session";
export * from "@/providers/auth/password-policy";
