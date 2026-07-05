/**
 * @file index.ts
 * @module providers/data
 *
 * @description
 * The **multi-data-provider map** Refine consumes (see PLAN.md §4.5). Every
 * resource resolves through the provider named on its `meta.dataProviderName`,
 * defaulting to `default` when absent — which lets us migrate resources from
 * mock to real API **one at a time**.
 *
 * ## Wiring
 *
 * - `default` — the resolver the majority of resources should use. When
 *   `VITE_API_MOCK` is on this is the mock provider (fast, offline dev); when
 *   off it's the real REST provider (Laravel + Sanctum).
 * - `mock` — always the mock provider. Resources whose backend module hasn't
 *   shipped yet explicitly point `dataProviderName: "mock"` at this — see the
 *   {@link BACKEND_READY_RESOURCES} allow-list applied by the registry.
 *
 * The two entries are the **same instance** when in mock mode (both `default`
 * and `mock` point at the same mock provider), so no double caching.
 */

import type { DataProvider } from "@refinedev/core";

import { env } from "@/config/env";
import { httpClient } from "@/lib/http";
import { createMockDataProvider } from "@/providers/data/mock-data-provider";
import { createRestDataProvider } from "@/providers/data/rest-data-provider";

/**
 * Resources whose backend module is ready today (see PLAN.md §0.a matrix).
 * A resource **not** in this set is silently pinned to the `mock` provider by
 * the registry, so the SPA keeps working even with `VITE_API_MOCK=false`.
 *
 * When a backend module ships:
 *  1. Add its resource name here.
 *  2. Optional cleanup: delete the fixture at `public/data/<resource>.json`.
 *  3. Ship.
 *
 * ## What does NOT belong here
 *
 * Backend endpoints that are exposed as **RPC calls** (not paginated CRUD
 * collections) must not be added — Refine's data provider would issue
 * `getList` shaped requests they don't answer. Today that includes:
 *
 *  - `/api/billing/*` (status, catalog, invoices, checkout, portal, …)
 *    — used by the Billing module's `httpClient`-driven hooks.
 *  - `/api/entitlements/usage`
 *    — used by the Entitlements module's `httpClient` hook.
 *
 * Modules that expose those endpoints register their sidebar entry as a
 * Refine resource with `meta.dataProviderName = "mock"` so any accidental
 * `useList("subscription")` short-circuits to the (empty) mock provider
 * instead of hitting the RPC endpoint.
 */
export const BACKEND_READY_RESOURCES: ReadonlySet<string> = new Set([
  // ✅ Tenant admin CRUD (platform admin surface).
  "tenants",
  // ✅ Feature-flags per tenant (platform admin surface).
  "features",
]);

/** The shared mock provider (used by both `default` and `mock` in mock mode). */
const mockDataProvider = createMockDataProvider({
  latencyMs: env.VITE_APP_ENV === "local" ? 250 : 0,
});

/**
 * The provider map Refine consumes. In mock mode the two keys are the same
 * instance so `useList({ resource: "tenants" })` and
 * `useList({ resource: "athletes", meta: { dataProviderName: "mock" } })` both
 * short-circuit to the fixture path.
 *
 * Note: the REST provider's `apiPrefix` is `/v1` because `httpClient.baseUrl`
 * already ends with `/api` (resolved from the host context).
 */
export const dataProviders: { default: DataProvider; [name: string]: DataProvider } =
  env.VITE_API_MOCK
    ? {
        default: mockDataProvider,
        mock: mockDataProvider,
      }
    : {
        default: createRestDataProvider(httpClient, { apiPrefix: "/v1" }),
        mock: mockDataProvider,
      };

/** Convenience export — the default provider (mostly for tests). */
export const dataProvider: DataProvider = dataProviders.default;

export { createMockDataProvider } from "@/providers/data/mock-data-provider";
export { createRestDataProvider } from "@/providers/data/rest-data-provider";
