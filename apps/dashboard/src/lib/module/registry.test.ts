/**
 * @file registry.test.ts
 * @module lib/module/registry.test
 *
 * @description
 * Unit tests for the module registry — the pure aggregation of feature-module
 * manifests. The `import.meta.glob` in `registry.ts` runs at module load, so
 * we import `appResources` + `publicRoutes` + `protectedRoutes` directly and
 * assert on the aggregated result (rather than trying to isolate the glob
 * itself).
 *
 * The dominant behaviour under test is the {@link BACKEND_READY_RESOURCES}
 * allow-list: any resource NOT in the set — and whose manifest has not
 * overridden `meta.dataProviderName` — is transparently pinned to `"mock"` by
 * the registry so Refine reads from fixtures instead of the REST provider.
 */

import { describe, expect, it } from "vitest";

import type { AppResource } from "@/lib/module";

import { appResources, protectedRoutes, publicRoutes } from "@/lib/module";
import { BACKEND_READY_RESOURCES } from "@/providers/data";

/** Finds a registered resource by canonical name (returns `undefined` if absent). */
function findResource(name: string): AppResource | undefined {
  return appResources.find((resource) => resource.name === name);
}

describe("BACKEND_READY_RESOURCES contract", () => {
  it("includes today's shipped platform resources", () => {
    // Sample across the shipped modules: platform admin, Access, Finance,
    // Athletics, Competitions. If any of these regress the migration
    // slipped backwards.
    expect(BACKEND_READY_RESOURCES.has("tenants")).toBe(true);
    expect(BACKEND_READY_RESOURCES.has("features")).toBe(true);
    expect(BACKEND_READY_RESOURCES.has("roles")).toBe(true);
    expect(BACKEND_READY_RESOURCES.has("invoices")).toBe(true);
    expect(BACKEND_READY_RESOURCES.has("athletes")).toBe(true);
    expect(BACKEND_READY_RESOURCES.has("competitions")).toBe(true);
  });

  it("excludes resources whose backend module has not shipped", () => {
    // These names correspond to frontend module folders whose backend
    // counterpart isn't a fixture-first module yet. Update this list as
    // those backend modules ship.
    for (const notReady of ["credentials", "documents", "people", "users", "workspaces"]) {
      expect(BACKEND_READY_RESOURCES.has(notReady)).toBe(false);
    }
  });
});

describe("appResources", () => {
  it("registers at least one resource", () => {
    expect(appResources.length).toBeGreaterThan(0);
  });

  it("pins fixture-only resources to the mock provider", () => {
    // Pick a resource we know the registry has (`people`) that is NOT in
    // the backend allow-list — the registry must auto-inject
    // `dataProviderName: "mock"` so Refine never issues a REST call.
    const people = findResource("people");

    if (people === undefined) {
      // Nothing to assert if the FE has retired the `people` module.
      // Guard rather than fail so the test survives an FE-side rename.
      return;
    }

    expect(people.meta.dataProviderName).toBe("mock");
  });

  it("pins every not-yet-shipped resource to the mock provider", () => {
    // Every registered resource that is NOT in the allow-list must end up on
    // mock, otherwise Refine would call a REST endpoint that does not exist.
    for (const resource of appResources) {
      if (BACKEND_READY_RESOURCES.has(resource.name)) {
        continue;
      }

      expect(resource.meta.dataProviderName).toBe("mock");
    }
  });

  it("leaves backend-ready resources on the default provider", () => {
    // Any registered resource that IS in the allow-list must NOT be pinned
    // to mock. `dataProviderName === undefined` is acceptable (Refine falls
    // back to the `default` key).
    for (const resource of appResources) {
      if (!BACKEND_READY_RESOURCES.has(resource.name)) {
        continue;
      }

      expect(resource.meta.dataProviderName).not.toBe("mock");
    }
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
