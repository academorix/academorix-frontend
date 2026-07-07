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
 * ## Provider factory
 *
 * The REST provider itself lives in `@academorix/query/refine` — a
 * shared package so future consumers (admin surface, landing page)
 * reuse the same wire-format contract as the dashboard. This file only
 * binds it to the dashboard's shared {@link httpClient} + versioned
 * `/v1` prefix.
 */

import { createRefineRestDataProvider } from "@academorix/query/refine";

import type { DataProvider } from "@refinedev/core";

import { httpClient } from "@/lib/http";
import { noopDataProvider } from "@/providers/data/noop-data-provider";

/**
 * The single REST data provider Refine consumes. Kept as a stable
 * reference so hot-reload does not spawn a second instance and blow
 * the Refine caches.
 *
 * The structural type of the provider returned by
 * {@link createRefineRestDataProvider} is a mirror of Refine v5's
 * `DataProvider` interface, so the assignment below is a plain
 * upcast — no runtime cost.
 */
const restDataProvider: DataProvider = createRefineRestDataProvider(httpClient, {
  apiPrefix: "/v1",
}) as DataProvider;

/**
 * The provider map Refine consumes.
 *
 *  - `default` — every CRUD-backed resource resolves here (the REST
 *    provider). Refine falls back to it whenever a resource does not
 *    set {@code meta.dataProviderName}.
 *  - `noop` — a stub for nav-only resources whose page talks to
 *    the backend through {@link "@/lib/http" httpClient} directly
 *    (RPC-style endpoints, not CRUD collections). See
 *    {@link "@/providers/data/noop-data-provider"} for rationale.
 */
export const dataProviders: { default: DataProvider; noop: DataProvider } = {
  default: restDataProvider,
  noop: noopDataProvider,
};

/** Convenience export — the default provider (mostly for tests). */
export const dataProvider: DataProvider = dataProviders.default;

export { noopDataProvider } from "@/providers/data/noop-data-provider";
