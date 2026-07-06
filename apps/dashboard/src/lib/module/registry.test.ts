/**
 * @file registry.test.ts
 * @module lib/module/registry.test
 *
 * @description
 * Unit tests for the module registry — the pure aggregation of feature-module
 * manifests. The {@code import.meta.glob} in {@code registry.ts} runs at
 * module load, so we import {@code appResources} + {@code publicRoutes} +
 * {@code protectedRoutes} directly and assert on the aggregated result
 * (rather than trying to isolate the glob itself).
 *
 * Previous versions of this file exercised the mock-provider allow-list
 * ({@code BACKEND_READY_RESOURCES}) that auto-pinned unmigrated resources to
 * {@code meta.dataProviderName = "mock"}. That behaviour was removed
 * alongside the mock data layer; the tests below now only assert the
 * registry's remaining responsibilities: manifest aggregation, sidebar
 * ordering, and public / protected route partitioning.
 */

import { describe, expect, it } from "vitest";

import type { AppResource } from "@/lib/module";

import { appResources, protectedRoutes, publicRoutes } from "@/lib/module";

/** Finds a registered resource by canonical name (returns {@code undefined} if absent). */
function findResource(name: string): AppResource | undefined {
  return appResources.find((resource) => resource.name === name);
}

describe("appResources", () => {
  it("registers at least one resource", () => {
    expect(appResources.length).toBeGreaterThan(0);
  });

  it("preserves the manifest-declared label + icon on registered resources", () => {
    const athletes = findResource("athletes");

    if (athletes === undefined) {
      return;
    }

    expect(athletes.meta.label).toBe("Athletes");
    // Icon must be a React component reference (Heroicons uses forwardRef,
    // so the runtime shape is either a function or a forwardRef object).
    expect(athletes.meta.icon).toBeDefined();
    expect(["function", "object"]).toContain(typeof athletes.meta.icon);
  });

  it("orders resources ascending by meta.order", () => {
    const orders = appResources.map((resource) => resource.meta.order ?? 0);
    const sorted = [...orders].sort((a, b) => a - b);

    expect(orders).toEqual(sorted);
  });

  it("does not silently inject a 'mock' data-provider name", () => {
    // With the mock layer removed the registry must never rewrite
    // `meta.dataProviderName` to `"mock"`. Manifests that opt into a
    // secondary provider explicitly stay untouched.
    for (const resource of appResources) {
      expect(resource.meta.dataProviderName).not.toBe("mock");
    }
  });
});

describe("publicRoutes", () => {
  it("is non-empty (auth module contributes several)", () => {
    expect(publicRoutes.length).toBeGreaterThan(0);
  });

  it("only contains routes on the public tier", () => {
    for (const route of publicRoutes) {
      expect(route.tier).toBe("public");
    }
  });

  it("every public route has an element to render", () => {
    for (const route of publicRoutes) {
      expect(route.element).toBeDefined();
    }
  });
});

describe("protectedRoutes", () => {
  it("only contains routes on the protected tier", () => {
    for (const route of protectedRoutes) {
      expect(route.tier).toBe("protected");
    }
  });

  it("every protected route has an element to render", () => {
    for (const route of protectedRoutes) {
      expect(route.element).toBeDefined();
    }
  });
});
