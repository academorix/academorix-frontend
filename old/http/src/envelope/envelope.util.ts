/**
 * @file envelope.util.ts
 * @module @academorix/http/envelope/envelope.util
 *
 * @description
 * Helpers for the two response envelopes the Academorix backend emits:
 *
 * 1. **Foundation envelope** — every Foundation controller returns
 *    `{ message, status, data, meta? }`. Lists include a `meta.total`
 *    + pagination fields; single resources return `data` without
 *    `meta`.
 * 2. **Bare DTO** — Auth tokens (`AuthTokenData` etc.) are returned as
 *    the DTO at the ROOT of the response, no `data`/`message`
 *    wrapping, so JS clients can read `body.access_token` directly.
 *
 * The HTTP client keeps both shapes on the wire; consumers call
 * {@link unwrapEnvelope} to lift `data` out for the common case, and
 * `getList`-style callers use {@link extractPaginationMeta} to lift
 * the `meta.total` Refine expects.
 */

/**
 * Shape of a Foundation envelope, generic over the payload. `T` may be
 * a single resource, a list, or `null` (204 responses). `meta` is only
 * present when the controller supplied it (paginators do).
 */
export interface FoundationEnvelope<T> {
  message?: string;
  status?: number;
  data: T;
  meta?: FoundationMeta;
}

/** Pagination + custom meta returned by Foundation's `apiResponse`. */
export interface FoundationMeta {
  current_page?: number;
  per_page?: number;
  from?: number | null;
  to?: number | null;
  total?: number;
  last_page?: number;
  [key: string]: unknown;
}

/**
 * Structural type guard — does the raw response body look like a
 * Foundation envelope? We intentionally accept `data` as any value
 * (including `null`) but require it to be present as an own property
 * so a DTO with an unrelated `data` field doesn't get mis-classified.
 */
export function isFoundationEnvelope(body: unknown): body is FoundationEnvelope<unknown> {
  return typeof body === "object" && body !== null && "data" in (body as Record<string, unknown>);
}

/**
 * Lifts `data` from a Foundation envelope, or returns the body
 * unchanged when the response is a bare DTO. Used when the caller
 * wants the payload directly.
 */
export function unwrapEnvelope<T>(body: unknown): T {
  if (isFoundationEnvelope(body)) {
    return body.data as T;
  }

  return body as T;
}

/**
 * Extracts `{ total, meta }` from a paginated Foundation envelope.
 * Returns `total: undefined` and an empty meta object when the
 * response is not paginated (single resource, bare DTO), so `getList`
 * callers can pass the result through unconditionally.
 */
export function extractPaginationMeta(body: unknown): {
  total: number | undefined;
  meta: FoundationMeta;
} {
  if (!isFoundationEnvelope(body) || !body.meta) {
    return { total: undefined, meta: {} };
  }

  return { total: body.meta.total, meta: body.meta };
}
