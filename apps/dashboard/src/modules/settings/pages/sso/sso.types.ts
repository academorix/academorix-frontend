/**
 * @file sso.types.ts
 * @module modules/settings/pages/sso/sso.types
 *
 * @description
 * Local, page-scoped shapes for the `/settings/sso` surface. Every
 * type here mirrors a slice of the backend's
 * `TenantIdentityProviderData` DTO — but expressed as a plain
 * interface so the page + wizards can reason about the fixture rows
 * (see `src/refine/data/identity-providers.json`) without importing
 * from a resource-agnostic base.
 *
 * The fixture ships camelCase keys today (matching Refine's default
 * mapping); the eventual HTTP data provider translates the backend's
 * snake_case wire shape at the boundary. Keeping the type definition
 * in one place means the fixture + real provider stay honest with
 * each other on future field additions.
 */

/**
 * Well-known keys the SSO admin surface references. Kept as `const`
 * so callers pick from the union rather than juggling raw strings.
 *
 * ## Why constants
 *
 * Every route, resource name, and endpoint suffix used by this
 * feature is centralised here so a rename lands in exactly one
 * place. The alternative — scattering `"identity-providers"`
 * literals across the wizard + page — has burned this codebase
 * before on the resource-registration side.
 */
export const SSO_KEYS = {
  /** The Refine resource id the fixture provider is registered under. */
  RESOURCE: "identity-providers",
  /** The relative endpoint the test probe posts to. */
  TEST_ACTION_SUFFIX: "test",
  /** The feature-flag key gating the sign-in affordances (identity-store). */
  FEATURE_SSO_ENABLED: "sso_enabled",
} as const;

/**
 * Federation protocol supported by a tenant IdP.
 *
 * Matches the backend {@link https://... SsoProtocol} enum wire values.
 */
export type SsoProtocol = "saml" | "oidc";

/**
 * Health-probe verdict for an IdP. Aligned with the backend
 * {@link https://... HealthStatus} enum. Nullable because a
 * newly-enrolled row has never been probed.
 */
export type SsoHealthStatus = "healthy" | "degraded" | "unknown";

/**
 * Wire shape for a single row in the `identity-providers` resource.
 *
 * Every optional field is optional because the fixture reflects the
 * discriminated-union nature of the two protocols: SAML rows carry
 * `issuerUrl` + `ssoUrl` + `x509Cert` flags but null out the OIDC
 * columns, and vice-versa.
 */
export interface IdentityProviderRow {
  id: string;
  tenantId?: string;
  protocol: SsoProtocol;
  name: string;
  emailDomain: string;
  isPrimary: boolean;
  allowJit: boolean;
  issuerUrl?: string | null;
  ssoUrl?: string | null;
  spEntityId?: string | null;
  hasX509Cert?: boolean;
  discoveryUrl?: string | null;
  clientId?: string | null;
  hasClientSecret?: boolean;
  scopes?: readonly string[] | null;
  jitRoleMap?: Record<string, string> | null;
  healthStatus?: SsoHealthStatus | null;
  healthCheckedAt?: string | null;
  certExpiresAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/**
 * The single probe-step result emitted by the "test the flow"
 * endpoint. Every check surfaces a stable `name` (so the UI keys the
 * spinner → checkmark transition per row) plus an `ok` + `message`
 * pair the caller can render verbatim.
 *
 * Names are stable slugs — never localised copy — so the UI can key
 * off them (e.g. show a doc link for `discovery_reachable` failures
 * that points to the OIDC issuer setup guide).
 */
export interface HealthCheckResult {
  name: string;
  ok: boolean;
  message: string;
}

/**
 * Envelope returned by `POST /api/v1/tenancy/identity-providers/{id}/test`.
 */
export interface HealthProbeResponse {
  ok: boolean;
  checks: readonly HealthCheckResult[];
}

/**
 * Number of days at which a SAML cert expiry counts as "expiring
 * soon" — highlights the row + renders the date in danger colour.
 */
export const CERT_EXPIRY_WARN_DAYS = 30;
