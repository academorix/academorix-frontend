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

import type { AuthUser } from "@/types/models";

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
 * Successful login/refresh payload. The backend issues a Sanctum bearer token
 * plus the authenticated user so the client can seed its identity cache
 * without a second round-trip.
 *
 * @see IDENTITY_AND_TENANCY_SPEC.md §4 "Authentication" (laravel/sanctum tokens)
 */
export interface AuthTokenResponse {
  /** Plain-text Sanctum bearer token. */
  token: string;
  /** Always `"Bearer"`; typed for forward-compatibility. */
  token_type: "Bearer";
  /** ISO-8601 expiry, or `null` for non-expiring tokens. */
  expires_at: string | null;
  /** The freshly authenticated user. */
  user: AuthUser;
}
