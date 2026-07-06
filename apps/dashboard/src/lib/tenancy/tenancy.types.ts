/**
 * @file tenancy.types.ts
 * @module lib/tenancy/tenancy.types
 *
 * @description
 * Types owned by the tenancy layer: the current tenant **workspace** (distinct
 * from the tenant-hosted domain data model in `@/types/platform`, which
 * covers the ID/branding/business_type fields), and the cross-tenant
 * "workspaces I can sign in to" listing used by the Slack-style picker.
 */

import type { HostContext } from "@/lib/http";
import type { TenantBranding, TenantSummary } from "@/types";

/**
 * The tenant currently hosting this browser session, resolved on boot from
 * `GET /api/current-tenant`. This mirrors the backend's `TenantData` DTO
 * (see `modules/Tenancy/src/Data/TenantData.php`).
 *
 * On the **central** and **central-admin** hosts this is `null` — those hosts
 * are not scoped to a tenant.
 */
export interface TenantWorkspace extends TenantSummary {
  /** Lifecycle status of the tenant, e.g. `"active"`, `"trialing"`. */
  status: string;
  /** Human-readable status label from the backend. */
  status_label?: string;
  /** Human-readable business type label. */
  business_type_label?: string;
  /** Full branding (may extend `TenantSummary.branding`). */
  branding: TenantBranding;
}

/**
 * A single entry in the workspace picker. Compact and safe to show without a
 * signed-in session: name + slug + logo + a hint of the last active date.
 *
 * Sourced from the (planned) `GET /api/v1/auth/workspaces` endpoint (backend
 * gap G3). Until that endpoint lands, the fixture at `/data/workspaces.json`
 * powers the picker.
 */
export interface WorkspaceListEntry {
  /** Tenant UUID. */
  id: string;
  /** URL slug (e.g. `"riverside"` → `riverside.academorix.app`). */
  slug: string;
  /** Human-readable name. */
  name: string;
  /** Logo URL, or `null` for the default mark. */
  logo_url: string | null;
  /** Role the user holds in this workspace (short display label). */
  role: string | null;
  /** ISO-8601 timestamp of the last active session, or `null`. */
  last_active_at: string | null;
}

/**
 * The value the {@link "@/lib/tenancy/tenant-context".TenantProvider} exposes
 * to its consumers.
 */
export interface TenancyContextValue {
  /** The host context this session boots on (never changes at runtime). */
  host: HostContext;
  /**
   * The currently hosting tenant, or `null` on a central host / while the
   * bootstrap request is in flight / when the API is unreachable in mock mode.
   */
  tenant: TenantWorkspace | null;
  /** Whether the bootstrap `/api/current-tenant` request is still resolving. */
  isLoading: boolean;
  /** The last bootstrap error, or `null`. */
  error: Error | null;
  /** Convenience: `host.kind === "central" || "central-admin"`. */
  isCentral: boolean;
  /** Convenience: `host.kind === "central-admin"`. */
  isCentralAdmin: boolean;
  /** Convenience: `host.kind === "tenant"` and a tenant resolved. */
  isTenant: boolean;
}
