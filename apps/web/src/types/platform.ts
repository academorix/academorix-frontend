/**
 * @file platform.ts
 * @module types/platform
 *
 * @description
 * The platform hierarchy and the authenticated identity. These model the
 * five-level structure every record lives in — **Tenant → Region →
 * Organization → Branch → Team** — plus the `Identity`/scope shapes the shell
 * consumes from `GET /auth/me`.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §1 "The academy hierarchy"
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.2-10.4 (Tenancy, Geo/Region, Organization)
 */

import type { BaseModel, TenantScoped } from "@/types/base";
import type { BusinessType, EntityStatus } from "@/types/enums";
import type { QuotaHeadline, SubscriptionSummary } from "@/types/subscription";

/**
 * Per-tenant white-label branding, delivered in the bootstrap payload and
 * applied to the shell/theme.
 *
 * Backend source: `TenantBranding` (via `TenantSummaryData.branding`). The
 * cross-tenant list in `/me.tenants[]` strips branding to keep the payload
 * small — hence the nullable field on the summary.
 */
export interface TenantBranding {
  /** Public logo URL, or `null` to fall back to the default mark. */
  logo_url: string | null;
  /** Primary brand color (CSS color), applied to the accent token. */
  primary_color: string | null;
  /** Favicon URL, or `null`. */
  favicon_url: string | null;
  /** Secondary brand color, or `null`. */
  secondary_color?: string | null;
  /** Accent brand color, or `null`. */
  accent_color?: string | null;
  /** Sender display name for outbound emails. */
  email_from_name?: string | null;
  /** Sender email address. */
  email_from_address?: string | null;
  /** Reply-to address. */
  email_reply_to?: string | null;
  /** Custom CSS injected into the tenant shell. */
  custom_css?: string | null;
}

/**
 * The tenant — the academy business that subscribes to Academorix. It is the
 * isolation boundary; every tenant-owned record carries its `tenant_id`.
 */
export interface Tenant extends BaseModel {
  /** Subdomain slug, e.g. `"elite"` in `elite.academorix.app`. */
  slug: string;
  /** Human-readable academy name. */
  name: string;
  /** Drives default roles, terminology, and feature toggles. */
  business_type: BusinessType;
  /** Lifecycle status of the tenant account. */
  status: EntityStatus;
  /** White-label branding. */
  branding: TenantBranding;
}

/**
 * Compact tenant descriptor embedded in the authenticated identity — just what
 * the shell needs to render branding and pick terminology. The cross-tenant
 * list in `/me.tenants[]` strips branding (fetched on switch) so `branding`
 * is nullable.
 */
export interface TenantSummary {
  id: string;
  /** Subdomain slug. */
  slug: string;
  name: string;
  /**
   * Drives default roles + terminology + feature toggles. Nullable because a
   * legacy tenant may not have been backfilled yet.
   */
  business_type: BusinessType | null;
  /** Lifecycle status, e.g. `"active"`, `"trialing"`. */
  status?: string;
  /** Human-readable status label, e.g. `"Active"`, `"Trialing"`. */
  status_label?: string;
  /** Optional branding for the shell (may be absent on the cross-tenant summary). */
  branding: TenantBranding | null;
}

/**
 * A **Region** — the commercial/tax/locale context a branch bills under. It is a
 * cross-cutting commercial dimension, **not** a physical place.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.3 "Geo & Region"
 */
export interface Region extends BaseModel, TenantScoped {
  name: string;
  /** ISO-4217 currency code, e.g. `"AED"`. */
  currency_code: string;
  /** ISO-3166 country codes this region bills. */
  countries: string[];
  /** IANA timezone, e.g. `"Asia/Dubai"`. */
  timezone: string;
  /** BCP-47 locale, e.g. `"ar"`. */
  locale: string;
  /** Free-form tax configuration (rate/label), opaque to the UI. */
  tax_config: Record<string, unknown> | null;
}

/**
 * An **Organization** — a sub-brand/division inside a tenant. A default
 * organization always exists so every code path is uniform.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.4 "Organization"
 */
export interface Organization extends BaseModel, TenantScoped {
  /** Parent organization for nested divisions, or `null` at the top. */
  parent_id: string | null;
  name: string;
  /** Whether this is the tenant's auto-created default organization. */
  is_default: boolean;
  status: EntityStatus;
}

/**
 * A **Branch** — a physical venue belonging to an organization. Points at a
 * Region for its commercial context.
 *
 * @see DOMAIN_MODULES_BLUEPRINT.md §10.4 "Organization"
 */
export interface Branch extends BaseModel, TenantScoped {
  organization_id: string;
  /** Commercial context (currency/tax/locale), or `null` if inherited. */
  region_id: string | null;
  name: string;
  /** URL-safe identifier within the tenant. */
  slug: string;
  status: EntityStatus;
  city: string;
  country: string;
  /** IANA timezone for the venue. */
  timezone: string;
  /** Maximum simultaneous occupancy. */
  capacity: number;
  contact_email: string | null;
  contact_phone: string | null;
  /** Whether this is the organization's default branch. */
  is_default: boolean;
}

/**
 * A compact scope option surfaced to the switchers. Each of the switcher data
 * sources (organizations/branches/seasons) reduces to this minimal shape.
 */
export interface ScopeOption {
  id: string;
  name: string;
  /** Whether this option is the default/current for its dimension. */
  is_default?: boolean;
}

/**
 * The caller's accessible scopes, delivered in `/auth/me` and used to populate
 * the organization/branch/season switchers.
 */
export interface AllowedScopes {
  /** Organizations the caller may work in. */
  organizations: Array<ScopeOption>;
  /** Branches the caller may work in (each tagged with its organization). */
  branches: Array<ScopeOption & { organization_id: string; region_id?: string | null }>;
  /** Seasons the caller may work in (each tagged with its status/current flag). */
  seasons: Array<ScopeOption & { status?: string; is_current?: boolean }>;
}

/**
 * UI-facing identity derived from the authenticated user. Everything the shell
 * needs to render "who is signed in", gate navigation, populate the scope
 * switchers, and render the subscription/quota chrome — with no PII beyond
 * what the header shows.
 *
 * Authorization is entirely data-driven: `roles`/`permissions`/`features`/
 * `terminology` come from the backend, never hardcoded.
 */
export interface Identity {
  id: string;
  /** Display name shown in the navbar / sidebar footer. */
  name: string;
  email: string;
  avatar_url: string | null;
  /** Uppercase initials for the avatar fallback, e.g. `"JD"`. */
  initials: string;
  /** RBAC roles (raw strings, seeded per business type). */
  roles: string[];
  /** Effective permission strings; `["*"]` = superuser. */
  permissions: string[];
  /** Enabled feature keys for this tenant (feature toggles). */
  features: string[];
  /** Per-tenant terminology overrides keyed by resource name. */
  terminology: Record<string, string>;
  /** The active tenant. */
  tenant: TenantSummary;
  /** Other tenants the caller belongs to (drives the workspace switcher). */
  tenants: TenantSummary[];
  /** The caller's accessible organizations/branches/seasons. */
  scopes: AllowedScopes;
  /**
   * Current subscription snapshot, or `null` when the tenant hasn't checked
   * out yet (shell renders a "Choose a plan" onboarding CTA on that state).
   */
  subscription: SubscriptionSummary | null;
  /**
   * Headline quotas (3-5 rows) so list pages can render "You're at 95/100"
   * without another fetch. Unlimited grants are stripped by the backend.
   */
  quota_summary: QuotaHeadline[];
}

/**
 * Platform administrator identity returned by `/api/v1/platform/auth/me`.
 * Platform admins are not tenant-scoped, so this shape intentionally has NO
 * `tenant`/`tenants`/`scopes`/`subscription`/`quota_summary`.
 */
export interface PlatformIdentity {
  /** Integer PK (platform users live on the central DB with auto-increment). */
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  initials: string;
  /** RBAC roles (`super_admin`, `ops`, `support`). */
  roles: string[];
  /** `["*"]` for `super_admin`; enumerated otherwise. */
  permissions: string[];
  /** Stable discriminator — always `true` for this shape. */
  is_platform_admin: true;
  /** ISO-8601 timestamp of 2FA enrolment confirmation, or `null`. */
  two_factor_confirmed_at: string | null;
}
