/**
 * @file schema.d.ts
 * @module lib/api/schema
 *
 * @description
 * **Generated file placeholder.**
 *
 * This is a hand-written stub so the typed {@link apiClient} compiles before
 * the backend publishes its OpenAPI document. Once the Laravel API exposes a
 * spec, regenerate this file with:
 *
 * ```sh
 * pnpm --filter @academorix/dashboard codegen
 * # → openapi-typescript <VITE_API_URL>/api/openapi.json -o src/lib/api/schema.d.ts
 * ```
 *
 * The real output will replace these empty shapes with fully-typed `paths`,
 * `components`, and `operations`, giving `openapi-fetch` end-to-end type safety
 * on every request path, parameter, and response.
 *
 * Until then the shapes are intentionally empty: the client is constructed and
 * has its auth middleware attached, but no typed routes exist yet.
 */

/** Map of URL paths → operations. Populated by codegen. */
export type paths = Record<string, never>;

/** Reusable component schemas. Populated by codegen. */
export interface components {
  schemas: Record<string, never>;
}

/** Named operations keyed by `operationId`. Populated by codegen. */
export type operations = Record<string, never>;

/** Webhook definitions, if any. Populated by codegen. */
export type webhooks = Record<string, never>;
