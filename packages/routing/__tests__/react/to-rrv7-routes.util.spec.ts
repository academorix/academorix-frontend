/**
 * @file to-rrv7-routes.util.spec.ts
 * @module @stackra/routing/__tests__/react
 * @description Unit tests for the route-tree adapter.
 */

import { describe, expect, it } from "vitest";

import { STACKRA_HANDLE } from "@/core/constants";
import { toRrv7Routes } from "@/react/adapt-page-module/to-rrv7-routes.util";

describe("toRrv7Routes", () => {
  it("transforms an inline route record with children", () => {
    const Component = (): null => null;
    const Child = (): null => null;
    const result = toRrv7Routes([
      {
        path: "/",
        Component,
        seo: { title: "Home" },
        children: [{ index: true, Component: Child, seo: { title: "Index" } }],
      },
    ]);
    expect(result).toHaveLength(1);
    const root = result[0];
    expect(root.path).toBe("/");
    expect(root.Component).toBe(Component);
    expect(root.children).toHaveLength(1);
    const child = root.children![0];
    expect(child.index).toBe(true);
    expect(child.Component).toBe(Child);
  });

  it("wraps lazy imports so they run through the adapter on load", async () => {
    const Component = (): null => null;
    // Simulate a page module import.
    const modulePromise = {
      default: Component,
      page: {
        seo: { title: "Blog" },
        breadcrumb: "Blog",
      },
    };

    const result = toRrv7Routes([
      {
        path: "/blog",
        lazy: async () => modulePromise,
      },
    ]);

    expect(result).toHaveLength(1);
    expect(typeof result[0].lazy).toBe("function");
    // Invoke the lazy to confirm the adapter runs.
    const adapted = await (result[0].lazy as () => Promise<Record<string, unknown>>)();
    expect(adapted).toBeDefined();
    const handle = adapted.handle as Record<string | symbol, unknown>;
    expect(handle.breadcrumb).toBe("Blog");
  });

  it("carries a synthesised STACKRA_HANDLE for inline routes", () => {
    const guards = ["auth"];
    const result = toRrv7Routes([
      {
        path: "/dashboard",
        Component: () => null,
        guards,
      },
    ]);
    const handle = result[0].handle as Record<string | symbol, unknown>;
    const stackra = handle[STACKRA_HANDLE] as { readonly guards: unknown };
    expect(stackra.guards).toEqual(guards);
  });
});
