/**
 * @file index.test.ts
 * @module providers/data/index.test
 *
 * @description
 * Smoke tests for the single Refine {@link DataProvider} exported by
 * {@code providers/data}. The dual mock/default map + the
 * {@code BACKEND_READY_RESOURCES} allow-list were removed alongside the
 * mock layer — every resource now flows through the REST provider — so
 * the only invariants left to guard are:
 *
 * 1. The exported {@code dataProviders.default} value is shaped like a
 *    Refine {@code DataProvider} (structural check so we survive Refine
 *    minor-version noise).
 * 2. The convenience {@code dataProvider} export is the same instance
 *    as {@code dataProviders.default}.
 */

import { describe, expect, it } from "vitest";

import type { DataProvider } from "@refinedev/core";

import { dataProvider, dataProviders } from "@/providers/data";

/**
 * Whether the given value is shaped like a Refine {@link DataProvider}.
 * Structural so it survives any Refine minor-version noise.
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

  it("exports the default provider as `dataProvider` for convenience", () => {
    expect(dataProvider).toBe(dataProviders.default);
  });

  it("resolves an API URL that ends with the versioned prefix", () => {
    // The REST provider is created with `apiPrefix: "/v1"` on top of the
    // HTTP client's `/api` base. The exact origin varies by host context,
    // but the URL must end with `/api/v1` — no trailing slash, no `/data`.
    const url = dataProviders.default.getApiUrl();

    expect(url.endsWith("/api/v1")).toBe(true);
  });
});
