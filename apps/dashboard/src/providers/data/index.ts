/**
 * @file index.ts
 * @module providers/data
 *
 * @description
 * Wires the single Refine {@link DataProvider} the application uses at
 * runtime. Every resource resolves through the real Laravel REST API
 * (Sanctum-authenticated, tenant- or platform-scoped depending on the
 * current host).
 *
 * ## History note
 *
 * The dashboard used to ship a mock provider backed by static JSON
 * fixtures under `public/data/` and a {@code BACKEND_READY_RESOURCES}
 * allow-list that pinned unmigrated resources to that mock provider.
 * That entire dual-provider migration layer has been removed now that
 * every domain module ships a real fixture-first / DB-backed HTTP
 * surface on the backend (see {@code backend/modules/**}). Resources
 * are addressed uniformly via {@code /api/v1/<name>}; no per-resource
 * routing lives here anymore.
 *
 * ## Wiring
 *
 * - `default` — the only entry Refine consumes. Every {@code useList},
 *   {@code useOne}, {@code useCreate}, ... calls the REST provider.
 * - The REST provider prepends {@code /v1} because {@code httpClient.baseUrl}
 *   already ends with {@code /api} (resolved from the host context).
 *
 * Endpoints that are RPC-style (not paginated CRUD collections) are
 * called via the {@code httpClient} directly, not through this
 * provider — this includes {@code /api/billing/*},
 * {@code /api/entitlements/usage}, and {@code /api/auth/*}.
 */

import type { DataProvider } from "@refinedev/core";

import { httpClient } from "@/lib/http";
import { createRestDataProvider } from "@/providers/data/rest-data-provider";

/**
 * The single REST data provider Refine consumes. Kept as a stable
 * reference so hot-reload does not spawn a second instance and blow
 * the Refine caches.
 */
const restDataProvider: DataProvider = createRestDataProvider(httpClient, { apiPrefix: "/v1" });

/**
 * The provider map Refine consumes. Only the {@code default} key is
 * populated; Refine falls back to it whenever a resource does not set
 * {@code meta.dataProviderName}.
 */
export const dataProviders: { default: DataProvider } = {
  default: restDataProvider,
};

/** Convenience export — the default provider (mostly for tests). */
export const dataProvider: DataProvider = dataProviders.default;

export { createRestDataProvider } from "@/providers/data/rest-data-provider";
