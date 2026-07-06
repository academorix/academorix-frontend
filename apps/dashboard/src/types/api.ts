/**
 * @file api.ts
 * @module types/api
 *
 * @description
 * Transport-level types that describe the *envelopes* the REST API wraps
 * domain data in — as opposed to `models.ts`, which describes the domain
 * entities themselves.
 *
 * These shapes follow Laravel conventions:
 * - A single resource is wrapped in `{ data: T }` (API Resource).
 * - A collection is wrapped in `{ data: T[], meta: {...}, links: {...} }`
 *   (Resource Collection with `paginate()`).
 * - Validation failures use the `{ message, errors: { field: string[] } }`
 *   shape produced by Laravel's `ValidationException` (HTTP 422).
 *
 * The data providers translate between these envelopes and the flat
 * `{ data, total }` shape Refine expects.
 */

/**
 * Laravel API Resource envelope for a **single** record. Mutation endpoints
 * (create/update/delete) may include a human-readable `message` for toasts;
 * reads omit it.
 *
 * @typeParam T - The wrapped domain model.
 */
export interface ApiResource<T> {
  data: T;
  message?: string;
}

/**
 * Pagination metadata block returned by Laravel's length-aware paginator
 * under the `meta` key of a Resource Collection response.
 */
export interface LaravelPaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  /** Grand total of matching records across all pages — what Refine needs. */
  total: number;
}

/**
 * Hypermedia links block returned alongside {@link LaravelPaginationMeta}.
 * Not consumed directly (Refine drives pagination via page numbers) but typed
 * for completeness and future infinite-scroll use.
 */
export interface LaravelPaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

/**
 * Laravel Resource Collection envelope for a **paginated list** of records.
 *
 * @typeParam T - The wrapped domain model.
 */
export interface LaravelPaginatedResponse<T> {
  data: T[];
  meta: LaravelPaginationMeta;
  links: LaravelPaginationLinks;
}

/**
 * Body of a Laravel `422 Unprocessable Entity` validation error.
 * `errors` maps each invalid field to one or more human-readable messages.
 */
export interface ApiValidationErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}

/**
 * Credentials accepted by the login endpoint (`POST /api/auth/login`).
 * `device_name` lets the backend name the issued Sanctum token per device.
 */
export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
  device_name?: string;
}

/**
 * Successful login/refresh payload from the tenant + platform auth endpoints.
 * Matches the backend's `Academorix\Auth\Data\AuthTokenData` DTO (see PLAN.md
 * §1.4 for the exact shape) — the token + freshly authenticated user + the
 * ability list encoded on the token.
 *
 * The user embedded in this response is intentionally **minimal**
 * ({@link BackendUserData}); the rich identity (roles, permissions, features,
 * terminology, tenants, scopes) is loaded from `GET /api/v1/auth/me` after
 * login (PLAN.md gap G1).
 *
 * @see IDENTITY_AND_TENANCY_SPEC.md §4 "Authentication" (laravel/sanctum tokens)
 */
export interface AuthTokenResponse {
  /** Plain-text Sanctum bearer token — only appears here at issue time. */
  access_token: string;
  /** Always `"Bearer"`; typed loosely for forward-compatibility. */
  token_type: string;
  /** Sorted, deduplicated ability list encoded on this token. */
  abilities: string[];
  /** Additive rule-based risk score (0..100). */
  risk_score: number;
  /** ISO-8601 absolute expiry; `null` for non-expiring login tokens. */
  expires_at: string | null;
  /** Count of recovery codes remaining after a successful redemption. */
  recovery_codes_remaining?: number | null;
  /**
   * `true` only on the platform pre-enrolment path where the caller's token
   * carries a single restricted ability of `two_factor_enable`.
   */
  two_factor_setup_required?: boolean;
  /** The freshly authenticated user (minimal shape). */
  user: BackendUserData;
}

/**
 * Minimal user representation returned by the backend's login/register/refresh
 * DTOs (`UserData` on tenant surface, `PlatformUserData` on platform surface).
 *
 * NOTE: the rich, shell-facing identity (roles/permissions/features/tenants/
 * scopes) lives on {@link AuthUser} and is delivered by the `/me` bootstrap
 * endpoint after login.
 */
export interface BackendUserData {
  id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  status: string;
  last_login_at: string | null;
}

/**
 * Alternate login response when the account has 2FA enabled. Matches the
 * backend's `TwoFactorRequiredData` — no bearer token is issued; the caller
 * must redeem the challenge token via `POST /two-factor/challenge`.
 */
export interface TwoFactorRequiredResponse {
  two_factor_required: true;
  challenge_token: string;
  challenge_url: string;
  challenge_expires_in: number;
}

/** Discriminates the two login response shapes. */
export function isTwoFactorRequired(
  response: AuthTokenResponse | TwoFactorRequiredResponse,
): response is TwoFactorRequiredResponse {
  return "two_factor_required" in response && response.two_factor_required === true;
}
