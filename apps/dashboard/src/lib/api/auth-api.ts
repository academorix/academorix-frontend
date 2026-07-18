/**
 * @file auth-api.ts
 * @module lib/api/auth-api
 *
 * @description
 * Typed thin wrappers around every auth-related endpoint the dashboard
 * consumes. Every function is a one-liner over {@link http} so call
 * sites read as declarative RPC (`authApi.login({email, password})`)
 * rather than fetch mechanics.
 *
 * Contracts mirror the backend DTOs:
 *
 *   - Request bodies use snake_case field names (the backend maps
 *     inputs through `SnakeCaseMapper`).
 *   - Response bodies also use snake_case (backend applies
 *     `MapOutputName(SnakeCaseMapper)`).
 *   - We convert to camelCase at the boundary of the auth provider,
 *     not in these wrappers — keeps the API-level types truthful to
 *     the wire representation for anyone reading the DTOs.
 *
 * When the backend introduces a new field, the type here is the
 * single place we need to widen — every dashboard call site inherits
 * the addition automatically.
 *
 * ## Mock branch
 *
 * When {@link MOCK_API_ENABLED} is on (local / dev builds — see the
 * matching flag in `refine/auth-provider.ts`), a handful of read
 * endpoints short-circuit with synthetic data so the dashboard can
 * boot without a Laravel backend on `VITE_API_URL`:
 *
 *   - {@link authApi.previewWorkspace} — returns a canned
 *     {@link WorkspacePreview} for whichever slug the caller
 *     entered. `workspace_url` uses {@link buildTenantUrl} so the
 *     redirect lands on `http://<slug>.localhost:3000` — modern
 *     browsers resolve `*.localhost` to `127.0.0.1` by RFC 6761,
 *     so the same Vite dev server serves the tenant flow and
 *     `resolveWorkspace()` picks the slug out of the hostname just
 *     like production would.
 *
 * Mutation endpoints stay on the real fetch path; the auth-provider
 * mocks them separately so mock mode covers the write side too.
 */

import { http } from "@/lib/api/http-client";
import { buildTenantUrl } from "@/lib/auth/workspace-resolver";
import { loadDashboardData } from "@/hooks/use-dashboard-data";

// ---------------------------------------------------------------------------
// Request shapes
// ---------------------------------------------------------------------------

/** Payload for `POST /api/auth/login`. */
export interface LoginPayload {
  email: string;
  password: string;
  /** Optional device label persisted on the Sanctum PAT. */
  device_name?: string;
}

/** Payload for `POST /api/auth/register`. */
export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  invitation_token?: string;
}

/** Payload for `POST /api/v1/signup` — new workspace creation. */
export interface SignupPayload {
  workspace_name: string;
  workspace_slug: string;
  full_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  accepted_terms: boolean;
}

/** Payload for `POST /api/auth/forgot-password`. */
export interface ForgotPasswordPayload {
  email: string;
}

/** Payload for `POST /api/auth/reset-password`. */
export interface ResetPasswordPayload {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

/** Payload for `POST /api/v1/auth/find-workspaces`. */
export interface FindWorkspacesPayload {
  email: string;
}

/**
 * Public branding preview for a single workspace — emitted by
 * `GET /api/v1/workspaces/{slug}`. Only fields safe to reveal to an
 * anonymous visitor are exposed; the tenant chose to publish these
 * by setting them on `TenantBranding`.
 */
export interface WorkspacePreview {
  slug: string;
  name: string;
  business_type: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  workspace_url: string;
  is_sign_in_enabled: boolean;
}

/** Payload for `POST /api/auth/two-factor/challenge`. */
export interface TwoFactorChallengePayload {
  challenge_token: string;
  code: string;
  /** Set when the user is entering a recovery code instead of a TOTP. */
  is_recovery_code?: boolean;
}

/** Payload for `POST /api/auth/change-password`. */
export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

/** Payload for `POST /api/auth/confirm-password`. */
export interface ConfirmPasswordPayload {
  password: string;
}

/** Payload for `POST /api/auth/phone/otp/request`. */
export interface PhoneOtpRequestPayload {
  phone: string;
}

/** Payload for `POST /api/auth/phone/otp/login`. */
export interface PhoneOtpLoginPayload {
  phone: string;
  code: string;
  device_name?: string;
}

/** Payload for `POST /api/auth/forgot-password/sms`. */
export interface ForgotPasswordSmsPayload {
  phone: string;
}

/** Payload for `POST /api/auth/reset-password/sms`. */
export interface ResetPasswordSmsPayload {
  phone: string;
  code: string;
  password: string;
  password_confirmation: string;
}

/** Payload for `POST /api/auth/phone/verify/request`. */
export interface PhoneVerificationRequestPayload {
  phone: string;
}

/** Payload for `POST /api/auth/phone/verify/confirm`. */
export interface PhoneVerificationConfirmPayload {
  code: string;
}

/** Payload for `POST /api/auth/me/mfa-methods`. */
export interface CreateMfaMethodPayload {
  method: "totp" | "sms" | "email" | "webauthn";
  label?: string;
  phone?: string;
}

/** Payload for `POST /api/auth/me/mfa-methods/{id}/verify`. */
export interface VerifyMfaMethodPayload {
  code: string;
}

/** Payload for `POST /api/auth/webauthn/login/verify` and register/verify. */
export interface WebauthnVerifyPayload {
  credential: unknown;
  challenge_id?: string;
}

// ---------------------------------------------------------------------------
// SSO — federated sign-in (SAML + OIDC)
// ---------------------------------------------------------------------------

/**
 * Result envelope returned by `POST /api/sso/lookup` — the domain
 * sniff the sign-in page runs against the caller's email to decide
 * whether the tenant has SSO enabled for that domain.
 *
 * Every field is optional because the endpoint deliberately returns
 * an empty envelope on a miss (never a 404) so it can't be used as
 * an enrolment-enumeration oracle. Consumers should branch on
 * `sso_url` being truthy: present → redirect, absent → fall through
 * to the password step.
 */
export interface SsoLookupResult {
  /** Absolute URL to redirect the browser to (SAML SSO endpoint). */
  sso_url?: string | null;
  /** Protocol the tenant enrolled for this domain. */
  protocol?: "saml" | "oidc" | null;
  /** Slug of the tenant the IdP belongs to — useful for analytics. */
  tenant_slug?: string | null;
}

/**
 * Envelope returned by `POST /api/sso/{slug}/{saml|oidc}/initiate`.
 *
 * SAML flows populate `sso_url` (the `AuthnRequest` redirect target)
 * plus a `request_id` the ACS controller cross-checks against the
 * `InResponseTo` header on the returned assertion. OIDC flows use
 * `authorization_url` (the OP's `/authorize` endpoint) plus a `state`
 * nonce the callback controller verifies against its per-request
 * cache entry.
 *
 * Consumers pick whichever URL is present — the two branches are
 * mutually exclusive but sharing a single envelope keeps the caller
 * from having to know the protocol before it dispatches.
 */
export interface SsoInitiateResult {
  /** SAML AuthnRequest redirect URL (SP-initiated). */
  sso_url?: string;
  /** OIDC authorization endpoint URL. */
  authorization_url?: string;
  /** SAML request id (correlated on ACS). */
  request_id?: string;
  /** OIDC state nonce (correlated on callback). */
  state?: string;
}

/**
 * Response from `POST /api/auth/webauthn/login/options` — the
 * PublicKeyCredentialRequestOptionsJSON expected by
 * `@simplewebauthn/browser`'s `startAuthentication`. Kept as
 * `unknown` at the API boundary so the browser lib validates the
 * shape at call time.
 */
export interface WebauthnOptionsResponse {
  options: unknown;
  challenge_id: string;
}

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

/**
 * Slim user envelope embedded in the login response. The full identity
 * comes from `GET /api/auth/me` — this shape is only what's needed to
 * paint the shell before that follow-up call resolves.
 */
export interface AuthUserSummary {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  timezone?: string | null;
  locale?: string | null;
}

/** Success envelope from `POST /api/auth/login`. */
export interface LoginResponse {
  access_token: string;
  token_type: "Bearer";
  /** ISO-8601 timestamp; `null` when `sanctum.expiration` is disabled. */
  expires_at: string | null;
  abilities: readonly string[];
  user: AuthUserSummary;
  /**
   * Present when the account is 2FA-enrolled and the login must
   * complete a challenge before the token grants full access. The
   * caller redirects to the 2FA challenge page and passes the
   * `challenge_token` in the follow-up POST.
   */
  two_factor_required?: never;
}

/** Branch envelope returned when the account is 2FA-enrolled. */
export interface TwoFactorRequiredResponse {
  two_factor_required: true;
  challenge_token: string;
  /** URL the challenge form should submit to; usually the same route. */
  challenge_url: string;
  /** Seconds until the challenge token expires. */
  challenge_expires_in: number;
}

/** Discriminated union covering both login success branches. */
export type LoginResult = LoginResponse | TwoFactorRequiredResponse;

/** Envelope for the 200 responses on anti-enumeration endpoints. */
export interface OpaqueSuccessResponse {
  message: string;
}

// ---------------------------------------------------------------------------
// Response shapes — settings surfaces (Phase 2)
// ---------------------------------------------------------------------------

/**
 * A single Sanctum PAT row surfaced by `GET /api/auth/me/sessions`.
 * Powers the "Devices + sessions" screen in Settings.
 */
export interface SessionEntry {
  id: number;
  device_name: string;
  abilities: readonly string[];
  ip_address: string | null;
  user_agent: string | null;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  is_current: boolean;
}

/**
 * A single MFA method row surfaced by `GET /api/auth/me/mfa-methods`.
 * Compact — secrets are always server-side (never in the wire shape).
 */
export interface MfaMethodEntry {
  id: string;
  method: "totp" | "sms" | "email" | "webauthn";
  label: string | null;
  /** E.164 phone with all but the last four digits masked. */
  phone_masked: string | null;
  is_primary: boolean;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
}

/**
 * Envelope from `POST /api/auth/me/mfa-methods` when enrolling a
 * TOTP method — includes the shared secret (base32) + otpauth URL so
 * the SPA can render a QR code + manual entry key. Only ever returned
 * once; the caller must persist / display it right away.
 */
export interface TotpEnrollmentResponse {
  method: MfaMethodEntry;
  /** Base32 shared secret. Only returned during enrolment. */
  secret: string;
  /** `otpauth://totp/...` URL suitable for QR code generation. */
  otpauth_url: string;
}

/** Envelope from `GET|POST /api/auth/two-factor/recovery-codes`. */
export interface RecoveryCodesResponse {
  codes: readonly string[];
}

/** Envelope from `GET /api/auth/email/verify`. */
export interface EmailVerificationStatusResponse {
  verified: boolean;
  email: string;
}

// ---------------------------------------------------------------------------
// Dashboard-side response shapes
// ---------------------------------------------------------------------------

/**
 * A single step in the onboarding checklist. Every field bar the
 * `complete` flag is static; the completion state is derived from
 * real tenant tables at read time (see backend
 * `TenantOnboardingService`).
 */
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  cta: string;
  route: string;
  icon: string;
  complete: boolean;
  /** ISO-8601 completion timestamp — null for incomplete steps. */
  completed_at: string | null;
}

/** Envelope from `GET /api/auth/me/onboarding`. */
export interface OnboardingStatusResponse {
  steps: readonly OnboardingStep[];
  completed_count: number;
  total_count: number;
  is_complete: boolean;
  /** Id of the first incomplete step, or null when everything is done. */
  next_step_id: string | null;
}

/**
 * A single entry in the dashboard activity feed. Sourced from
 * `spatie/laravel-activitylog` server-side and projected through
 * `ActivityEntryData`.
 */
export interface ActivityEntry {
  id: string;
  description: string;
  event: string;
  log_name: string | null;
  subject_type: string | null;
  subject_id: string | null;
  subject_label: string | null;
  causer_type: string | null;
  causer_id: string | null;
  causer_name: string | null;
  icon: string | null;
  created_at: string;
}

/** Standard pagination meta returned by every paginated endpoint. */
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

/**
 * Compact workspace projection returned by `GET /api/v1/me/workspaces`.
 * Powers the workspace-switcher dropdown in the shell.
 */
export interface MyWorkspaceEntry {
  id: string;
  slug: string;
  name: string;
  business_type: string | null;
  logo_url: string | null;
  role: string;
  last_active_at: string | null;
  is_staff_only_workspace: boolean;
}

// ---------------------------------------------------------------------------
// Mock mode
// ---------------------------------------------------------------------------

/**
 * Whether the API wrappers should short-circuit read endpoints with
 * synthetic data instead of hitting `VITE_API_URL`. Matches the
 * {@link MOCK_AUTH_ENABLED} flag in `refine/auth-provider.ts` so the
 * whole app runs consistently in mock mode without a running Laravel.
 * Production builds always fall through to the real endpoints.
 */
const MOCK_API_ENABLED =
  (import.meta.env.VITE_APP_ENV as string | undefined) === "local" || import.meta.env.DEV;

/**
 * Location of the boot-fixture that mirrors the shape of a real
 * `GET /api/auth/me` response — served by Vite from
 * `apps/dashboard/public/data/`. Reused by the mock `me()` branch
 * below so a successful mock login lands on the same identity the
 * identity-store hydrates in the anonymous-cold-start path.
 */
const MOCK_ME_FIXTURE_URL = "/data/current-user.json";

/**
 * TTL (ms) for the synthetic bearer token minted by mock login.
 * Mirrors the auth-provider's own mock — we can't share the
 * constant because that provider imports us (cycle avoidance), and
 * the two lifetimes should match anyway.
 */
const MOCK_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Derive a display name from a mock user's email so the login
 * envelope carries a name that at least reflects what the caller
 * typed. `"alex@academorix.demo"` → `"Alex"`.
 */
function synthesizeNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const cleaned = local.replace(/[._-]+/g, " ").trim();

  if (!cleaned) return "Demo User";

  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Build a synthetic {@link LoginResponse} for the mock branch of
 * {@link authApi.login}. The `access_token` is a marker string that
 * `readAccessToken()` will happily surface later; consumers that
 * inspect the payload for identity data (currently just the sign-in
 * page's `writeCachedUser` call) get a user derived from the email
 * so the shell has something to paint before `authApi.me()` runs.
 */
function synthesizeLoginResponse(email: string): LoginResponse {
  return {
    access_token: `dev-mock-token-${Date.now()}`,
    token_type: "Bearer",
    expires_at: new Date(Date.now() + MOCK_TOKEN_TTL_MS).toISOString(),
    abilities: ["*"],
    user: {
      id: "user-mock",
      full_name: synthesizeNameFromEmail(email),
      email,
      avatar_url: null,
      timezone: null,
      locale: null,
    },
  };
}

/**
 * Build a synthetic {@link WorkspacePreview} that reflects the slug
 * the caller entered.
 *
 * ## workspace_url on localhost
 *
 * `workspace_url` is the tenant subdomain URL — production returns
 * `https://acme-athletics.academorix.com` and the sign-in page
 * navigates the browser there so `resolveWorkspace()` on the target
 * page sees a real subdomain. In dev we compose the same shape via
 * {@link buildTenantUrl}, which produces `http://acme-athletics.localhost:3000`.
 * Modern browsers resolve any `<slug>.localhost` to `127.0.0.1`
 * (RFC 6761), so the redirect stays on the running Vite dev server
 * and the resolver picks the slug out of the hostname exactly as it
 * would in production. No wildcard DNS, no `/etc/hosts` edits, no
 * client-side override state to synchronise.
 *
 * The name derives from the slug (`"acme-athletics"` → `"Acme Athletics"`)
 * so the preview card shows something plausible without shipping a
 * per-slug fixture. The colour tokens come from the design system's
 * default accent so `applyWorkspaceCssVars` has real values to write.
 */
function synthesizeWorkspacePreview(slug: string): WorkspacePreview {
  const displayName =
    slug
      .split("-")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") || "Academorix";

  return {
    slug,
    name: displayName,
    business_type: "academy",
    logo_url: null,
    primary_color: "#10b981",
    secondary_color: "#0f172a",
    accent_color: "#22c55e",
    workspace_url: buildTenantUrl(slug),
    is_sign_in_enabled: true,
  };
}

/**
 * Simulated network latency (ms) for the mock branches. Big enough
 * for the sign-in form's `isSubmitting` state to render, small
 * enough not to feel sluggish.
 */
const MOCK_NETWORK_DELAY_MS = 220;

function delay<T>(value: T, ms = MOCK_NETWORK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

// ---------------------------------------------------------------------------
// Endpoint wrappers
// ---------------------------------------------------------------------------

/**
 * Namespace holding one function per auth endpoint. Grouped as a
 * const object (not a class) so consumers can destructure freely
 * (`const {login, logout} = authApi`) without instantiating anything.
 */
export const authApi = {
  /**
   * Log in with email + password. May return either a fresh token
   * envelope or a 2FA-challenge envelope; consumers inspect
   * `two_factor_required` to pick the branch.
   *
   * ## Mock branch
   *
   * In dev / local builds we short-circuit with a synthetic
   * {@link LoginResponse} — any non-empty email + password combo
   * succeeds and the sign-in page's post-login flow (write token,
   * refresh identity, navigate) proceeds against
   * {@link authApi.me}'s own mock branch. The auth-provider's
   * `mockLogin` covers callers that route through
   * `useLogin()`; this branch covers direct `authApi.login` calls
   * from the tenant sign-in page.
   */
  login(payload: LoginPayload): Promise<LoginResult> {
    if (MOCK_API_ENABLED) {
      return delay(synthesizeLoginResponse(payload.email));
    }

    return http.post<LoginResult>("/api/auth/login", payload, { anonymous: true });
  },

  /**
   * Complete a 2FA challenge for a login attempt. On success the
   * response shape matches {@link LoginResponse} — the caller stores
   * the token and continues to the dashboard.
   */
  twoFactorChallenge(payload: TwoFactorChallengePayload): Promise<LoginResponse> {
    return http.post<LoginResponse>("/api/auth/two-factor/challenge", payload, {
      anonymous: true,
    });
  },

  /**
   * Sign the caller out. Revokes the presenting token server-side.
   * Fails silently — the caller clears the local token regardless of
   * network outcome so a stuck server can't trap the user.
   */
  logout(): Promise<void> {
    return http.post<void>("/api/auth/logout");
  },

  /**
   * Rotate the presenting token — the server revokes the old one
   * and returns a fresh envelope. Used by the retry-on-401 branch of
   * the identity fetch.
   */
  refresh(): Promise<LoginResponse> {
    return http.post<LoginResponse>("/api/auth/refresh");
  },

  /**
   * Fetch the full identity manifest. The response shape is opaque
   * here — the auth provider maps it into the frontend
   * {@link Identity} type at the boundary so this file stays
   * decoupled from UI-facing types.
   *
   * ## Mock branch
   *
   * In dev we serve the same fixture the identity-store's boot
   * fallback consumes (`public/data/current-user.json`), so a mock
   * login lands on the identical manifest the shell would render
   * on an anonymous cold-start. Missing fixture / bad JSON falls
   * back to an empty object so `mapMePayload` degrades to the
   * `EMPTY_IDENTITY` scaffold instead of throwing.
   */
  async me<T = unknown>(): Promise<T> {
    if (MOCK_API_ENABLED) {
      try {
        const response = await fetch(MOCK_ME_FIXTURE_URL, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) return {} as T;

        return (await response.json()) as T;
      } catch {
        return {} as T;
      }
    }

    return http.get<T>("/api/auth/me");
  },

  /**
   * Register a new user on the current tenant. Consumed by the
   * invite-acceptance page — the tenant is already resolved from
   * the request host, so all we need is the caller's profile +
   * password.
   */
  register(payload: RegisterPayload): Promise<AuthUserSummary> {
    return http.post<AuthUserSummary>("/api/auth/register", payload, { anonymous: true });
  },

  /**
   * Create a brand-new workspace + owner user. Hits the central
   * signup endpoint on `/api/v1/signup` (not the tenant-scoped
   * `/api/auth/register`) so the tenant provisioner can create the
   * subdomain + seed the default settings.
   */
  signup(payload: SignupPayload): Promise<{ workspace_url: string; user: AuthUserSummary }> {
    return http.post<{ workspace_url: string; user: AuthUserSummary }>("/api/v1/signup", payload, {
      anonymous: true,
    });
  },

  /** Trigger the password-reset email flow. Always resolves 200. */
  forgotPassword(payload: ForgotPasswordPayload): Promise<OpaqueSuccessResponse> {
    return http.post<OpaqueSuccessResponse>("/api/auth/forgot-password", payload, {
      anonymous: true,
    });
  },

  /**
   * Consume the token from the reset email and set a new password.
   * The response never carries a fresh token — the caller must go
   * through `/sign-in` afterwards (Req 10.7 in the backend spec).
   */
  resetPassword(payload: ResetPasswordPayload): Promise<OpaqueSuccessResponse> {
    return http.post<OpaqueSuccessResponse>("/api/auth/reset-password", payload, {
      anonymous: true,
    });
  },

  /**
   * Slack-style "find my workspaces" recovery. The server emails the
   * caller the list of tenants their email is attached to; the
   * response body is always the same 200 envelope regardless of hit
   * or miss so a caller can't use the endpoint as an enumeration
   * oracle. Hits the CENTRAL API host (not the tenant subdomain),
   * so we bypass the tenant resolution by hitting `/api/v1/*`
   * explicitly — the backend's route file registers this endpoint
   * outside the `tenant` middleware group.
   */
  findWorkspaces(payload: FindWorkspacesPayload): Promise<OpaqueSuccessResponse> {
    return http.post<OpaqueSuccessResponse>("/api/v1/auth/find-workspaces", payload, {
      anonymous: true,
    });
  },

  /**
   * Preview a workspace by slug — powers the workspace-picker
   * "let me see this workspace before I redirect" flow. The
   * response carries branding tokens the tenant has published (logo
   * URL, brand colours, name) so the SPA can paint the tenant's
   * chrome before the caller lands on the redirected sign-in page.
   *
   * Rate-limited server-side (see `workspace-preview` in the Auth
   * module's rate limiter table). 404s uniformly on any miss —
   * malformed slug, unknown tenant, and non-active tenant all look
   * identical so the endpoint doesn't leak enumeration signal.
   */
  previewWorkspace(slug: string): Promise<WorkspacePreview> {
    // In mock mode we short-circuit the request so the sign-in
    // workspace-picker keeps working without a Laravel backend.
    // The synthetic preview's `workspace_url` uses the real
    // subdomain shape (`http://<slug>.localhost:3000`), so the
    // redirect lands on a hostname the resolver treats as a
    // tenant subdomain — same code path as production.
    if (MOCK_API_ENABLED) {
      return delay(synthesizeWorkspacePreview(slug));
    }

    return http.get<WorkspacePreview>(`/api/v1/workspaces/${encodeURIComponent(slug)}`, {
      anonymous: true,
    });
  },

  // -------------------------------------------------------------------------
  // Phase 2 — settings surfaces + advanced sign-in
  // -------------------------------------------------------------------------

  /** Change the caller's password. Revokes every other session on success. */
  changePassword(payload: ChangePasswordPayload): Promise<OpaqueSuccessResponse> {
    return http.post<OpaqueSuccessResponse>("/api/auth/change-password", payload);
  },

  /**
   * Confirm the caller's current password to unlock a downstream
   * sensitive action. The confirmation is cached server-side against
   * the presenting Sanctum token; the `password.confirm` middleware
   * checks that cache before letting the destructive verb through.
   */
  confirmPassword(payload: ConfirmPasswordPayload): Promise<OpaqueSuccessResponse> {
    return http.post<OpaqueSuccessResponse>("/api/auth/confirm-password", payload);
  },

  /** List every session (Sanctum PAT) tied to the current caller. */
  listSessions(): Promise<{ sessions: readonly SessionEntry[] }> {
    return http.get<{ sessions: readonly SessionEntry[] }>("/api/auth/me/sessions");
  },

  /** Revoke a single sibling session by id. Refuses to kill the current session. */
  revokeSession(id: number): Promise<OpaqueSuccessResponse> {
    return http.delete<OpaqueSuccessResponse>(`/api/auth/me/sessions/${id}`);
  },

  /** Revoke every session except the one that made this call. */
  revokeOtherSessions(): Promise<OpaqueSuccessResponse> {
    return http.delete<OpaqueSuccessResponse>("/api/auth/me/sessions");
  },

  /** List MFA methods (TOTP / SMS / Email / WebAuthn) enrolled on the caller. */
  listMfaMethods(): Promise<{ methods: readonly MfaMethodEntry[] }> {
    return http.get<{ methods: readonly MfaMethodEntry[] }>("/api/auth/me/mfa-methods");
  },

  /**
   * Start enrolment for a new MFA method. Returns the shared secret
   * + otpauth URL for TOTP; for SMS the response carries just the
   * pending method (the code arrives via SMS).
   */
  createMfaMethod(payload: CreateMfaMethodPayload): Promise<TotpEnrollmentResponse> {
    return http.post<TotpEnrollmentResponse>("/api/auth/me/mfa-methods", payload);
  },

  /** Finalise a pending MFA enrolment with the one-time code. */
  verifyMfaMethod(
    id: string,
    payload: VerifyMfaMethodPayload,
  ): Promise<{ method: MfaMethodEntry }> {
    return http.post<{ method: MfaMethodEntry }>(`/api/auth/me/mfa-methods/${id}/verify`, payload);
  },

  /** Promote a verified MFA method to primary. Requires password-confirm gate. */
  setPrimaryMfaMethod(id: string): Promise<{ method: MfaMethodEntry }> {
    return http.post<{ method: MfaMethodEntry }>(`/api/auth/me/mfa-methods/${id}/primary`);
  },

  /** Remove an MFA enrolment. Requires password-confirm gate. */
  deleteMfaMethod(id: string): Promise<OpaqueSuccessResponse> {
    return http.delete<OpaqueSuccessResponse>(`/api/auth/me/mfa-methods/${id}`);
  },

  /** Rotate the caller's 2FA recovery codes (requires password-confirm). */
  rotateRecoveryCodes(): Promise<RecoveryCodesResponse> {
    return http.post<RecoveryCodesResponse>("/api/auth/two-factor/recovery-codes");
  },

  /** List the caller's current 2FA recovery codes. */
  getRecoveryCodes(): Promise<RecoveryCodesResponse> {
    return http.get<RecoveryCodesResponse>("/api/auth/two-factor/recovery-codes");
  },

  // -------------------------------------------------------------------------
  // Phone OTP (SMS) — sign-in alternative + password reset variant
  // -------------------------------------------------------------------------

  /** Request an SMS OTP for sign-in. Always resolves 200. */
  phoneOtpRequest(payload: PhoneOtpRequestPayload): Promise<OpaqueSuccessResponse> {
    return http.post<OpaqueSuccessResponse>("/api/auth/phone/otp/request", payload, {
      anonymous: true,
    });
  },

  /** Complete an SMS OTP sign-in with the received code. */
  phoneOtpLogin(payload: PhoneOtpLoginPayload): Promise<LoginResult> {
    return http.post<LoginResult>("/api/auth/phone/otp/login", payload, { anonymous: true });
  },

  /** Request an SMS reset code for the "reset via phone" recovery variant. */
  forgotPasswordSms(payload: ForgotPasswordSmsPayload): Promise<OpaqueSuccessResponse> {
    return http.post<OpaqueSuccessResponse>("/api/auth/forgot-password/sms", payload, {
      anonymous: true,
    });
  },

  /** Consume an SMS reset code + set a new password. */
  resetPasswordSms(payload: ResetPasswordSmsPayload): Promise<OpaqueSuccessResponse> {
    return http.post<OpaqueSuccessResponse>("/api/auth/reset-password/sms", payload, {
      anonymous: true,
    });
  },

  /**
   * Send an SMS verification code to a signed-in caller's phone
   * number. Used to add + verify a phone during profile setup, and
   * again later to swap a lost number.
   */
  phoneVerificationRequest(
    payload: PhoneVerificationRequestPayload,
  ): Promise<OpaqueSuccessResponse> {
    return http.post<OpaqueSuccessResponse>("/api/auth/phone/verify/request", payload);
  },

  /** Confirm the SMS verification code the caller received. */
  phoneVerificationConfirm(
    payload: PhoneVerificationConfirmPayload,
  ): Promise<OpaqueSuccessResponse> {
    return http.post<OpaqueSuccessResponse>("/api/auth/phone/verify/confirm", payload);
  },

  // -------------------------------------------------------------------------
  // WebAuthn (Passkey) — options + verify for both login + register
  // -------------------------------------------------------------------------

  /** Fetch a PublicKeyCredentialRequestOptionsJSON for passkey sign-in. */
  webauthnLoginOptions(payload: { email?: string }): Promise<WebauthnOptionsResponse> {
    return http.post<WebauthnOptionsResponse>("/api/auth/webauthn/login/options", payload, {
      anonymous: true,
    });
  },

  /** Verify a passkey assertion and issue a session token. */
  webauthnLoginVerify(payload: WebauthnVerifyPayload): Promise<LoginResult> {
    return http.post<LoginResult>("/api/auth/webauthn/login/verify", payload, { anonymous: true });
  },

  /** Fetch registration options for enrolling a new passkey. */
  webauthnRegisterOptions(payload: { label?: string }): Promise<WebauthnOptionsResponse> {
    return http.post<WebauthnOptionsResponse>("/api/auth/webauthn/register/options", payload);
  },

  /** Verify a passkey attestation and persist the credential. */
  webauthnRegisterVerify(payload: WebauthnVerifyPayload): Promise<{ method: MfaMethodEntry }> {
    return http.post<{ method: MfaMethodEntry }>("/api/auth/webauthn/register/verify", payload);
  },

  // -------------------------------------------------------------------------
  // Email verification
  // -------------------------------------------------------------------------

  /** Check whether the caller's email address is verified. */
  emailVerificationStatus(): Promise<EmailVerificationStatusResponse> {
    return http.get<EmailVerificationStatusResponse>("/api/auth/email/verify");
  },

  /** Resend the verification email. Idempotent — silent 202 when already verified. */
  emailVerificationResend(): Promise<OpaqueSuccessResponse> {
    return http.post<OpaqueSuccessResponse>("/api/auth/email/verification-notification");
  },

  /**
   * Consume a signed verification URL. `signature` + `expires` are
   * carried in the URL alongside the id/hash pair; we pass them
   * through verbatim so the server-side signature check still
   * passes.
   */
  emailVerify(payload: {
    id: string;
    hash: string;
    signature: string;
    expires: string;
  }): Promise<OpaqueSuccessResponse> {
    return http.get<OpaqueSuccessResponse>(
      `/api/auth/email/verify/${encodeURIComponent(payload.id)}/${encodeURIComponent(payload.hash)}`,
      {
        query: { signature: payload.signature, expires: payload.expires },
        anonymous: true,
      },
    );
  },

  // -------------------------------------------------------------------------
  // Dashboard-side reads — onboarding + activity + workspaces
  // -------------------------------------------------------------------------

  /**
   * Read the tenant's current onboarding checklist state. Each
   * step's `complete` flag is derived server-side from real
   * workspace state (see backend `TenantOnboardingService`), so a
   * user who ticks off a step by adding a real branch sees the row
   * flip within one refresh cycle.
   */
  async onboarding(): Promise<OnboardingStatusResponse> {
    // Mock: project the dashboard fixture onto the backend response
    // shape. `completed_at` is derived from the boolean `complete`
    // flag — real backend surfaces the actual timestamp, but for
    // dev "now if complete, null otherwise" is a fine stand-in.
    if (MOCK_API_ENABLED) {
      const fixture = await loadDashboardData();
      const steps: OnboardingStep[] = (fixture?.onboardingSteps ?? []).map((step) => ({
        id: step.id,
        title: step.title,
        description: step.description,
        cta: step.cta,
        route: step.route,
        icon: step.icon,
        complete: step.complete,
        completed_at: step.complete ? new Date().toISOString() : null,
      }));

      const completedCount = steps.filter((step) => step.complete).length;
      const totalCount = steps.length;
      const nextStep = steps.find((step) => !step.complete);

      return {
        steps,
        completed_count: completedCount,
        total_count: totalCount,
        is_complete: totalCount > 0 && completedCount === totalCount,
        next_step_id: nextStep?.id ?? null,
      };
    }

    return http.get<OnboardingStatusResponse>("/api/auth/me/onboarding");
  },

  /**
   * Read the tenant activity feed — the source powering the
   * dashboard's "Recent activity" widget. Sourced from
   * `spatie/laravel-activitylog` server-side; every domain module
   * writes its own semantic events via `activity()->log('…')`.
   *
   * The `perPage` param defaults to 8 — enough to fill the widget
   * without forcing a scroll.
   */
  async recentActivity(perPage = 8): Promise<{
    data: readonly ActivityEntry[];
    meta: PaginationMeta;
  }> {
    // Mock: project the dashboard fixture's activity entries onto
    // the backend's `ActivityEntry` shape. The fixture stores the
    // relative timestamp as a plain string ("2 min ago"); the
    // consumer widget renders it verbatim when it doesn't parse to
    // a date, so we surface it on `created_at`.
    if (MOCK_API_ENABLED) {
      const fixture = await loadDashboardData();
      const source = (fixture?.recentActivity ?? []).slice(0, perPage);
      const entries: ActivityEntry[] = source.map((row) => ({
        id: row.id,
        description: row.title,
        event: row.kind,
        log_name: row.kind,
        subject_type: null,
        subject_id: null,
        subject_label: row.description,
        causer_type: null,
        causer_id: null,
        causer_name: null,
        icon: row.icon,
        created_at: row.timestamp,
      }));

      return {
        data: entries,
        meta: {
          current_page: 1,
          per_page: perPage,
          total: entries.length,
          last_page: 1,
        },
      };
    }

    return http.get<{ data: readonly ActivityEntry[]; meta: PaginationMeta }>(
      "/api/v1/activities",
      { query: { per_page: perPage } },
    );
  },

  /**
   * Read every workspace the caller has a membership on. Powers
   * the workspace-switcher dropdown in the sidebar user pill. The
   * backend endpoint is auth-guarded so cross-tenant reads never
   * leak.
   */
  myWorkspaces(): Promise<{ workspaces: readonly MyWorkspaceEntry[] }> {
    return http.get<{ workspaces: readonly MyWorkspaceEntry[] }>("/api/v1/me/workspaces");
  },

  // -------------------------------------------------------------------------
  // SSO — federated sign-in (SAML + OIDC)
  // -------------------------------------------------------------------------

  /**
   * Domain-sniff a caller's email address against every enrolled
   * `TenantIdentityProvider` row. Called from the sign-in page as
   * step 0 — before we surface the password field — so users on an
   * SSO-federated email domain get bounced to their IdP transparently.
   *
   * ## Contract
   *
   * A domain miss returns an **empty envelope**, not a 404. That's
   * deliberate: a 404 would let an attacker enumerate which tenants
   * have SSO enrolled and for which domains (a low-value but
   * unnecessary information leak). Consumers must branch on
   * `sso_url` being truthy, not on the HTTP status.
   *
   * ## Timeout
   *
   * The caller wires an {@link AbortSignal} through `options.signal`
   * so a stall on this endpoint (slow DNS, cold cache on the backend)
   * doesn't block the primary email → password path. The sign-in
   * page aborts after 3 seconds and falls through to the password
   * step — see `SSO_LOOKUP_TIMEOUT_MS` in `sign-in.tsx`.
   *
   * Rate-limited server-side by IP.
   */
  ssoLookup(email: string, options: { signal?: AbortSignal } = {}): Promise<SsoLookupResult> {
    // In mock mode we always return the "miss" envelope so the
    // sign-in flow falls through to the password step without a
    // 3-second `AbortController` wall. Consumers only branch on
    // `sso_url` being truthy — `{}` is the canonical miss shape.
    if (MOCK_API_ENABLED) {
      return delay({}, 60);
    }

    return http.post<SsoLookupResult>(
      "/api/sso/lookup",
      { email },
      { anonymous: true, signal: options.signal },
    );
  },

  /**
   * Start an SP-initiated federated login. Hits
   * `POST /api/sso/{slug}/saml/initiate` for SAML or
   * `POST /api/sso/{slug}/oidc/initiate` for OIDC — the backend
   * builds the `AuthnRequest` / authorization URL, caches a
   * request-correlation nonce (60s TTL), and returns the redirect
   * target for the SPA to `window.location.assign` to.
   *
   * `identityProviderId` disambiguates when a tenant has more than
   * one IdP enrolled — the IdP-picker modal passes the selected row's
   * id here; a single-IdP tenant omits it and the backend uses the
   * primary IdP.
   */
  ssoInitiate(
    tenantSlug: string,
    protocol: "saml" | "oidc",
    identityProviderId?: string,
  ): Promise<SsoInitiateResult> {
    return http.post<SsoInitiateResult>(
      `/api/sso/${encodeURIComponent(tenantSlug)}/${protocol}/initiate`,
      identityProviderId ? { identity_provider_id: identityProviderId } : {},
      { anonymous: true },
    );
  },

  /**
   * Trade a one-time-use SSO handoff PAT for a long-lived Sanctum
   * PAT. Called by the `/sso/callback` page after either SAML ACS
   * or the OIDC callback redirects the browser back into the SPA
   * with `?token=<handoff>`.
   *
   * ## Bearer trickery
   *
   * The exchange endpoint expects the **handoff token** as the
   * `Authorization: Bearer` header, not the caller's normal session
   * token (they don't have one yet). Rather than teach the HTTP
   * wrapper about custom bearers, we {@link writeAuthToken} the
   * handoff first — the wrapper picks it up on this call — and then
   * overwrite with the real token from the response. A leaked
   * handoff that survives a network failure is cleared by the
   * callback page's error path via {@link clearAuthToken}.
   *
   * The backend rejects re-use with 401 (see `SsoExchangeController`
   * — the handoff row's `consumed_at` column is set inside a
   * `SELECT FOR UPDATE` transaction), so a replay by an attacker
   * watching the tab can't succeed.
   */
  ssoExchange(): Promise<LoginResponse> {
    return http.post<LoginResponse>("/api/auth/sso/exchange");
  },
};
