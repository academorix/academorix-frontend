/**
 * @file adapt-page-module.util.spec.ts
 * @module @stackra/routing/__tests__/react
 * @description Unit tests for the page-module → RouteObject adapter.
 */

import { describe, expect, it } from "vitest";

import { STACKRA_HANDLE } from "@/core/constants";
import { adaptPageModule } from "@/react/adapt-page-module/adapt-page-module.util";

describe("adaptPageModule", () => {
  it("extracts the component as RouteObject.Component", () => {
    const Component = (): null => null;
    const route = adaptPageModule({
      default: Component,
      page: {},
    });
    expect(route.Component).toBe(Component);
  });

  it("wraps page.load in an RRv7 loader", async () => {
    const route = adaptPageModule({
      default: () => null,
      page: {
        load: async ({ params }) => ({ slug: (params as { slug: string }).slug }),
      },
    });
    expect(typeof route.loader).toBe("function");
    // Invoke the loader with the RRv7 args shape.
    const request = new Request("http://placeholder/");
    const result = await (route.loader as (args: unknown) => Promise<unknown>)({
      params: { slug: "x" },
      request,
      // Extra fields RRv7 supplies but we don't require.
      context: {},
    } as never);
    expect(result).toEqual({ slug: "x" });
  });

  it("installs LoadingComponent as HydrateFallback", () => {
    const Loading = (): null => null;
    const route = adaptPageModule({
      default: () => null,
      page: { LoadingComponent: Loading },
    });
    expect(route.HydrateFallback).toBe(Loading);
  });

  it("installs ErrorComponent as ErrorBoundary", () => {
    const Error = (): null => null;
    const route = adaptPageModule({
      default: () => null,
      page: { ErrorComponent: Error },
    });
    expect(route.ErrorBoundary).toBe(Error);
  });

  it("populates handle[STACKRA_HANDLE] with the private bag", () => {
    const seo = { title: "Home" };
    const guards = ["auth"];
    const middleware = ["audit"];
    const route = adaptPageModule({
      default: () => null,
      page: {
        seo,
        guards,
        middleware,
        mode: "dialog",
        breadcrumb: "Home",
      },
    });
    const handle = route.handle as Record<string | symbol, unknown>;
    expect(handle.breadcrumb).toBe("Home");
    const stackra = handle[STACKRA_HANDLE] as {
      readonly seo: unknown;
      readonly guards: readonly string[];
      readonly middleware: readonly string[];
      readonly mode: string;
    };
    expect(stackra.seo).toBe(seo);
    expect(stackra.guards).toEqual(guards);
    expect(stackra.middleware).toEqual(middleware);
    expect(stackra.mode).toBe("dialog");
  });

  it("does not synth a loader when page.load is absent", () => {
    const route = adaptPageModule({
      default: () => null,
      page: {},
    });
    expect(route.loader).toBeUndefined();
  });
});
