/**
 * @file data-provider.ts
 * @module refine/data-provider
 *
 * @description
 * Client-side Refine {@link DataProvider} backed by static JSON fixtures served
 * from `public/api/v1/<resource>.json`. Each resource in the app resolves to a
 * fetch against its matching fixture — the Vite dev server (and any static
 * host in production) delivers the raw array; this file layers filter / sort /
 * paginate on top so `useList` / `useOne` / `useTable` behave like a real REST
 * data provider would.
 *
 * ## Why fetch instead of static imports?
 *
 *  - **Zero bundle cost** — every fixture ships alongside the app assets
 *    instead of being compiled into the JS chunk. The dashboard bundle no
 *    longer carries ~50 JSON blobs the caller may never touch.
 *  - **Realistic network surface** — DevTools shows a `GET /api/v1/athletes.json`
 *    just like production would show `GET /api/v1/athletes`. Fixture-vs-real
 *    routing swaps become a URL edit, not a build-config edit.
 *  - **Hot-swappable fixtures** — a designer can drop a fresh JSON file into
 *    `public/api/v1/` without a Vite restart. The in-memory cache is per-page-load
 *    only, so reload = fresh fetch = fresh data.
 *
 * Unknown resources resolve to `[]` (matches the previous behaviour) so a
 * newly-registered module never crashes the grid before its fixture is
 * seeded.
 */

import type { BaseKey, CrudFilter, CrudSort, DataProvider } from "@refinedev/core";

/** Base URL segment every fixture lives under. Kept as a constant so a future
 * move (e.g. `/mocks/`, `/fixtures/`) is a single-line edit. */
const FIXTURE_BASE_URL = "/api/v1";

/** A single row in a fixture — every resource must at least carry an `id`. */
type Row = Record<string, unknown> & { id: BaseKey };

/**
 * In-memory cache of resource fetches. Stores the *Promise*, not the resolved
 * array, so concurrent callers (e.g. two widgets both mounting `useList` on
 * the same page render) share a single network round-trip. Populated
 * lazily — a resource is only fetched the first time a hook asks for it.
 */
const datasetPromises = new Map<string, Promise<Row[]>>();

/**
 * Read (and cache) the fixture for a resource. Falls back to `[]` on any
 * failure — a missing fixture / network hiccup / malformed JSON never nukes
 * the caller's render, matching the previous "unknown resource" behaviour.
 */
function datasetFor(resource: string): Promise<Row[]> {
  const existing = datasetPromises.get(resource);

  if (existing) return existing;

  const fresh = fetch(`${FIXTURE_BASE_URL}/${resource}.json`, {
    headers: { Accept: "application/json" },
  })
    .then(async (response): Promise<Row[]> => {
      if (!response.ok) return [];

      // Vite's SPA history-fallback middleware serves the shell
      // index.html for unknown paths under `/api/v1/*.json` (any
      // path that doesn't match a static file). That's a 200 with
      // `text/html` — treat it as "no fixture" instead of trying
      // to parse the HTML as JSON, which would raise a noisy
      // SyntaxError and only then land on the catch-block fallback.
      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) return [];

      try {
        const payload = (await response.json()) as unknown;

        // The fixtures ship as raw arrays. We stay tolerant of a Laravel-style
        // envelope (`{data: [...]}`) too so a fixture can be swapped for a
        // real backend response verbatim without rewriting this loader.
        if (Array.isArray(payload)) return payload as Row[];

        const enveloped = (payload as { data?: unknown } | null)?.data;

        return Array.isArray(enveloped) ? (enveloped as Row[]) : [];
      } catch {
        return [];
      }
    })
    .catch((): Row[] => []);

  datasetPromises.set(resource, fresh);

  return fresh;
}

/** Nested-path getter (`"user.profile.name"`) with graceful failure. */
function getValue(row: Row, field: string): unknown {
  return field.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];

    return undefined;
  }, row);
}

/** Comparator: numeric-aware for strings so `athlete-2` sorts before `athlete-10`. */
function compare(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;

  return String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true });
}

function applySorters(rows: Row[], sorters?: CrudSort[]): Row[] {
  if (!sorters?.length) return rows;

  return [...rows].sort((rowA, rowB) => {
    for (const sorter of sorters) {
      const result = compare(getValue(rowA, sorter.field), getValue(rowB, sorter.field));

      if (result !== 0) return sorter.order === "desc" ? -result : result;
    }

    return 0;
  });
}

function matchesFilter(row: Row, filter: CrudFilter): boolean {
  // ---------------------------------------------------------------------
  // Conditional filter — a nested `{operator: "or" | "and", value: []}`
  // envelope. The free-text search feature on `ResourceGrid` emits an
  // `or` filter that spans every `meta.searchFields[]` entry so one
  // query hits every text axis the resource cares about.
  // ---------------------------------------------------------------------
  if (!("field" in filter)) {
    const nested = (filter.value ?? []) as CrudFilter[];

    if (filter.operator === "or") return nested.some((child) => matchesFilter(row, child));
    if (filter.operator === "and") return nested.every((child) => matchesFilter(row, child));

    // Unknown conditional operator — fail open so an unimplemented
    // predicate never nukes the entire result set.
    return true;
  }

  const value = getValue(row, filter.field);

  switch (filter.operator) {
    case "eq":
      return value === filter.value;
    case "ne":
      return value !== filter.value;
    case "contains":
      return String(value ?? "")
        .toLowerCase()
        .includes(String(filter.value ?? "").toLowerCase());
    case "gte":
      return Number(value) >= Number(filter.value);
    case "lte":
      return Number(value) <= Number(filter.value);
    default:
      return true;
  }
}

function applyFilters(rows: Row[], filters?: CrudFilter[]): Row[] {
  if (!filters?.length) return rows;

  return rows.filter((row) => filters.every((filter) => matchesFilter(row, filter)));
}

/**
 * Simulated latency (ms). Without this, the mock resolves on the next
 * microtask which flashes loading states in a jarring way and hides genuine
 * loading-state bugs. Keep it small — a real API on a warm cache lands in
 * roughly the same window.
 */
const NETWORK_DELAY_MS = 150;

/**
 * Race the payload against a small delay so mutation flows have a chance to
 * render their pending state. Uses the resolved payload as-is; the delay is a
 * side-channel only.
 */
async function withNetworkDelay<T>(value: T | Promise<T>): Promise<T> {
  const [resolved] = await Promise.all([
    Promise.resolve(value),
    new Promise((resolve) => setTimeout(resolve, NETWORK_DELAY_MS)),
  ]);

  return resolved as T;
}

export const dataProvider: DataProvider = {
  /**
   * The dev-facing "API URL" is a marker — nothing hits an origin here, but
   * Refine's devtools pane still expects a getter. `academorix://mock` is
   * distinctive enough that anyone reading the panel understands this is a
   * fixture provider.
   */
  getApiUrl: () => "academorix://mock",

  getList: async ({ resource, pagination, sorters, filters }) => {
    const source = await datasetFor(resource);
    const filtered = applyFilters(source, filters);
    const sorted = applySorters(filtered, sorters);

    const currentPage = pagination?.currentPage ?? 1;
    const pageSize = pagination?.pageSize ?? 10;
    const mode = pagination?.mode ?? "server";

    const paged =
      mode === "off" ? sorted : sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return withNetworkDelay({ data: paged as never, total: filtered.length });
  },

  getOne: async ({ resource, id }) => {
    const source = await datasetFor(resource);
    const record = source.find((row) => String(row.id) === String(id));

    return withNetworkDelay({ data: (record ?? {}) as never });
  },

  getMany: async ({ resource, ids }) => {
    const source = await datasetFor(resource);
    const wanted = new Set(ids.map(String));
    const records = source.filter((row) => wanted.has(String(row.id)));

    return withNetworkDelay({ data: records as never });
  },

  create: async ({ variables }) => withNetworkDelay({ data: variables as never }),

  update: async ({ id, variables }) =>
    withNetworkDelay({ data: { id, ...(variables as object) } as never }),

  deleteOne: async ({ id }) => withNetworkDelay({ data: { id } as never }),
};
