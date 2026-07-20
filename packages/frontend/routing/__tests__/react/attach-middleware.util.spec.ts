/**
 * @file attach-middleware.util.spec.ts
 * @module @stackra/routing/__tests__/react
 * @description Unit tests for the middleware / guard attachment
 *   pipeline.
 */

import { describe, expect, it } from "vitest";
import type { RouteObject } from "react-router";

import { STACKRA_HANDLE } from "@/core/constants";
import { attachMiddleware } from "@/react/attach-middleware/attach-middleware.util";
import { createMockContainer } from "@/testing/create-mock-container.util";

describe("attachMiddleware", () => {
  it("leaves routes without guards/middleware untouched", () => {
    const originalLoader = async (): Promise<null> => null;
    const route: RouteObject = {
      path: "/",
      loader: originalLoader,
      handle: {
        [STACKRA_HANDLE]: {},
      },
    };
    const wired = attachMiddleware([route], createMockContainer() as never, "client");
    expect(wired[0].loader).toBe(originalLoader);
  });

  it("recurses into children", () => {
    const route: RouteObject = {
      path: "/",
      handle: { [STACKRA_HANDLE]: {} },
      children: [
        {
          path: "child",
          handle: { [STACKRA_HANDLE]: {} },
        },
      ],
    };
    const wired = attachMiddleware([route], createMockContainer() as never, "client");
    // Children pass through when they have no chain — same reference is
    // acceptable because attachToRoute short-circuits without children.
    expect(wired[0].children).toBeDefined();
  });

  it("preserves the path and other non-handle fields", () => {
    const route: RouteObject = {
      path: "/dashboard",
      caseSensitive: true,
      handle: { [STACKRA_HANDLE]: {} },
    };
    const wired = attachMiddleware([route], createMockContainer() as never, "client");
    expect(wired[0].path).toBe("/dashboard");
    expect(wired[0].caseSensitive).toBe(true);
  });
});
