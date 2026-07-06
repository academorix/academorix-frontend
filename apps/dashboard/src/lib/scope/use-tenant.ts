/**
 * @file use-tenant.ts
 * @module lib/scope/use-tenant
 *
 * @description
 * Hook exposing the **tenant** dimension of scope, sourced from the
 * authenticated identity (`/auth/me`). Tenant is fixed per host/subdomain in
 * normal operation; cross-tenant users (coaches/guardians spanning academies)
 * may switch, which re-bootstraps the session.
 */

import { useGetIdentity, useLogout } from "@refinedev/core";

import type { Identity, TenantSummary } from "@/types";

/** The value returned by {@link useTenant}. */
interface UseTenantResult {
  /** The active tenant summary, or `undefined` before the identity loads. */
  tenant?: TenantSummary;
  /** All tenants the caller belongs to (length > 1 enables switching). */
  tenants: TenantSummary[];
  /** Whether the caller spans more than one tenant. */
  canSwitchTenant: boolean;
  /**
   * Switches the active tenant. In this SPA a tenant is bound to its subdomain,
   * so switching navigates to that tenant's host (which re-bootstraps identity
   * and resets scope). When no host mapping is available it falls back to
   * logging out so the user re-enters through the target tenant.
   *
   * @param tenant - The tenant to switch to.
   */
  switchTenant: (tenant: TenantSummary) => void;
}

/**
 * Reads the tenant dimension from the identity and provides a tenant-switch
 * action for cross-tenant users.
 */
export function useTenant(): UseTenantResult {
  const { data: identity } = useGetIdentity<Identity>();
  const { mutate: logout } = useLogout();

  const tenant = identity?.tenant;
  const tenants = identity?.tenants ?? (tenant ? [tenant] : []);
  const canSwitchTenant = tenants.length > 1;

  const switchTenant = (target: TenantSummary): void => {
    if (!target || target.id === tenant?.id) {
      return;
    }

    // Tenants are subdomain-bound; navigate to the target host in production.
    // Under a single dev host we cannot rebind, so we sign out to let the user
    // re-enter through the target tenant.
    const { protocol, host } = window.location;
    const rootDomain = host.split(".").slice(-2).join(".");
    const isMultiTenantHost = host.split(".").length > 2;

    if (isMultiTenantHost && rootDomain) {
      window.location.href = `${protocol}//${target.slug}.${rootDomain}`;

      return;
    }

    logout();
  };

  return { tenant, tenants, canSwitchTenant, switchTenant };
}
