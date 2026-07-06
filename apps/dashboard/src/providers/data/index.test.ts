/**
 * @file index.test.ts
 * @module providers/data/index.test
 *
 * @description
 * Unit tests for the multi-data-provider map + the {@link BACKEND_READY_RESOURCES}
 * allow-list. The tests run under the default `VITE_API_MOCK=true` env, so
 * `dataProviders.default` and `dataProviders.mock` are expected to reference
 * the same underlying mock provider instance.
 */

import { describe, expect, it } from "vitest";

import type { DataProvider } from "@refinedev/core";

import { BACKEND_READY_RESOURCES, dataProvider, dataProviders } from "@/providers/data";

/**
 * Whether the given value is shaped like a Refine `DataProvider`. Structural
 * so it survives any Refine minor-version noise.
 */
function looksLikeDataProvider(value: unknown): value is DataProvider {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as DataProvider).getList === "function" &&
    typeof (value as DataProvider).getOne === "function" &&
    typeof (value as DataProvider).create === "function" &&
    typeof (value as DataProvider).update === "function" &&
    typeof (value as DataProvider).deleteOne === "function" &&
    typeof (value as DataProvider).getApiUrl === "function"
  );
}

describe("dataProviders", () => {
  it("exposes a 'default' entry shaped like a DataProvider", () => {
    expect(dataProviders.default).toBeDefined();
    expect(looksLikeDataProvider(dataProviders.default)).toBe(true);
  });

  it("exposes a 'mock' entry shaped like a DataProvider", () => {
    expect(dataProviders.mock).toBeDefined();
    expect(looksLikeDataProvider(dataProviders.mock)).toBe(true);
  });

  it("re-uses the same mock instance for 'default' and 'mock' under VITE_API_MOCK=true", () => {
    // In mock mode the two entries reference the same underlying provider so
    // that Refine caches only one dataset per resource, not two.
    expect(dataProviders.default).toBe(dataProviders.mock);
  });

  it("exports the default provider as `dataProvider` for convenience", () => {
    expect(dataProvider).toBe(dataProviders.default);
  });
});

describe("BACKEND_READY_RESOURCES", () => {
  it("is a Set", () => {
    expect(BACKEND_READY_RESOURCES).toBeInstanceOf(Set);
  });

  it("contains the resources whose backend module has shipped", () => {
    // Sample across the shipped modules: platform admin, roles/permissions,
    // Finance, Athletics, Competitions. Adding a resource to the allow-list
    // must never regress these checks.
    expect(BACKEND_READY_RESOURCES.has("tenants")).toBe(true);
    expect(BACKEND_READY_RESOURCES.has("features")).toBe(true);
    expect(BACKEND_READY_RESOURCES.has("roles")).toBe(true);
    expect(BACKEND_READY_RESOURCES.has("invoices")).toBe(true);
    expect(BACKEND_READY_RESOURCES.has("athletes")).toBe(true);
    expect(BACKEND_READY_RESOURCES.has("matches")).toBe(true);
  });

  it("does not contain resources still served by fixtures", () => {
    // These names correspond to frontend module folders that don't yet
    // have a matching `/api/v1/{name}` route on the backend. Update this
    // list as those backend modules ship.
    for (const notReady of [
      "credentials",
      "documents",
      "people",
      "users",
      "workspaces",
      "organizations",
    ]) {
      expect(BACKEND_READY_RESOURCES.has(notReady)).toBe(false);
    }
  });
});
