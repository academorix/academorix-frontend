/**
 * @file noop-data-provider.ts
 * @module providers/data/noop-data-provider
 *
 * @description
 * A stub {@link DataProvider} that returns empty results for every method
 * without hitting the network. Used for **nav-only** Refine resources —
 * entries that appear in the sidebar but whose page talks to the backend
 * through {@link "@/lib/http" httpClient} directly (RPC-style endpoints,
 * not paginated CRUD collections).
 *
 * ## Why not just omit the resource?
 *
 * The sidebar renderer walks Refine's `resources` array to build the nav
 * tree, so the resource MUST be declared to appear in the UI. But we
 * don't want an accidental `useList("subscription")` from a stale hook
 * or bug in a downstream module to hit `/api/v1/subscription` (a URL
 * that doesn't exist as a CRUD collection — billing is a set of RPCs).
 *
 * ## Contract
 *
 * Every method resolves to a benign, semantically-consistent empty
 * shape:
 *  - `getList`   → `{ data: [], total: 0 }`
 *  - `getOne`    → `{ data: {} as never }` — Refine consumers should
 *    never call this, but if they do they get an obvious empty object
 *    rather than an HTTP error.
 *  - `create` / `update` / `deleteOne` → all resolve with a stub
 *    payload; no network traffic.
 *  - `getApiUrl` → an empty string, since nothing is fetched.
 *
 * Nothing here throws — the invariant is "nav-only surfaces stay
 * mounted no matter what". If we later want strict enforcement, wrap
 * the return in a dev-only `console.warn` so accidental usage becomes
 * visible.
 */

import type { DataProvider } from "@refinedev/core";

/**
 * Frozen no-op {@link DataProvider} instance. Consumed under the
 * {@code "noop"} key of the {@link dataProviders} map so nav-only
 * modules can opt in via {@code meta.dataProviderName: "noop"}.
 */
export const noopDataProvider: DataProvider = Object.freeze({
  getApiUrl: () => "",
  getList: async () => ({ data: [], total: 0 }),
  getOne: async () => ({ data: {} as never }),
  getMany: async () => ({ data: [] }),
  create: async ({ variables }) => ({ data: variables as never }),
  createMany: async ({ variables }) => ({ data: variables as never[] }),
  update: async ({ variables }) => ({ data: variables as never }),
  updateMany: async ({ variables }) => ({ data: [variables as never] }),
  deleteOne: async () => ({ data: {} as never }),
  deleteMany: async () => ({ data: [] }),
  custom: async () => ({ data: undefined as never }),
});
