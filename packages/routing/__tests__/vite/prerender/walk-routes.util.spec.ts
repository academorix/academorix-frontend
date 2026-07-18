/**
 * @file walk-routes.util.spec.ts
 * @module @stackra/routing/tests/vite/prerender
 * @description Unit tests for `walkRoutes` — the DFS walker the
 *   prerender pipeline uses to flatten nested route trees + compute
 *   full paths.
 */

import { describe, expect, it } from "vitest";

import type { IRouteRecord } from "@stackra/contracts";

import { walkRoutes } from "@/vite/prerender/walk-routes.util";

describe("walkRoutes", () => {
  it("walks a flat single-route tree", () => {
    const routes: IRouteRecord[] = [{ path: "/", Component: () => null }];
    const walked = walkRoutes(routes);
    expect(walked).toHaveLength(1);
    expect(walked[0]?.fullPath).toBe("/");
    expect(walked[0]?.hasSubdomainMatch).toBe(false);
    expect(walked[0]?.ancestors).toEqual([]);
  });

  it("joins nested paths with the parent prefix", () => {
    const routes: IRouteRecord[] = [
      {
        path: "/",
        children: [
          { path: "blog", Component: () => null },
          { path: "about", Component: () => null },
        ],
      },
    ];
    const walked = walkRoutes(routes);
    const paths = walked.map((w) => w.fullPath);
    // DFS — root first, then each child in order.
    expect(paths).toEqual(["/", "/blog", "/about"]);
  });

  it("treats index routes as the parent path", () => {
    const routes: IRouteRecord[] = [
      {
        path: "/",
        children: [{ index: true, Component: () => null }],
      },
    ];
    const walked = walkRoutes(routes);
    // Root + the index child both live at '/'.
    expect(walked.map((w) => w.fullPath)).toEqual(["/", "/"]);
    expect(walked[1]?.route.index).toBe(true);
  });

  it("preserves :param placeholders", () => {
    const routes: IRouteRecord[] = [
      {
        path: "/",
        children: [{ path: "blog/:slug", Component: () => null }],
      },
    ];
    const walked = walkRoutes(routes);
    expect(walked[1]?.fullPath).toBe("/blog/:slug");
  });

  it("carries an ancestor list on each entry", () => {
    const routes: IRouteRecord[] = [
      {
        path: "/",
        children: [
          {
            path: "app",
            children: [{ path: "dashboard", Component: () => null }],
          },
        ],
      },
    ];
    const walked = walkRoutes(routes);
    // Leaf route has two ancestors (root + `/app`).
    const dashboardEntry = walked.find((w) => w.fullPath === "/app/dashboard");
    expect(dashboardEntry).toBeDefined();
    expect(dashboardEntry?.ancestors).toHaveLength(2);
  });

  it("inherits hasSubdomainMatch from ancestors", () => {
    const routes: IRouteRecord[] = [
      {
        path: "/*",
        match: { subdomain: (() => true) as never },
        children: [{ path: "admin", Component: () => null }],
      },
    ];
    const walked = walkRoutes(routes);
    // Both root and child inherit the subdomain flag.
    expect(walked.every((w) => w.hasSubdomainMatch)).toBe(true);
  });

  it("handles lazy routes without evaluating them", () => {
    // The walker MUST NOT trigger lazy imports — that lands the
    // whole module tree in memory before we know we care about
    // prerendering the route. Callers evaluate `lazy` explicitly.
    let calls = 0;
    const routes: IRouteRecord[] = [
      {
        path: "/lazy",
        lazy: (): Promise<Record<string, unknown>> => {
          calls += 1;
          return Promise.resolve({});
        },
      },
    ];
    const walked = walkRoutes(routes);
    expect(walked).toHaveLength(1);
    expect(calls).toBe(0);
  });

  it("normalises trailing/leading slashes when joining", () => {
    const routes: IRouteRecord[] = [
      {
        path: "/base/",
        children: [{ path: "/child/" }],
      },
    ];
    const walked = walkRoutes(routes);
    // Trailing slashes are stripped, single joining slash inserted.
    expect(walked[1]?.fullPath).toBe("/base/child");
  });
});
