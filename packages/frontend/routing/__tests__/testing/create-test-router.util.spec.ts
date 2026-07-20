/**
 * @file create-test-router.util.spec.ts
 * @module @stackra/routing/__tests__/testing
 * @description Unit tests for the programmatic test router.
 */

import { describe, expect, it } from "vitest";

import { createTestRouter } from "@/testing/create-test-router.util";
import { expectRoute } from "@/testing/expect-route.util";
import { expectMatched } from "@/testing/expect-matched.util";

describe("createTestRouter", () => {
  it("boots at the initial entry", async () => {
    const router = createTestRouter(
      [
        { id: "root", path: "/", Component: () => null },
        { id: "dashboard", path: "/dashboard", Component: () => null },
      ],
      { initialEntries: ["/dashboard"] },
    );
    await router.waitForIdle();
    expect(router.pathname()).toBe("/dashboard");
  });

  it("navigates to a new pathname via router.navigate", async () => {
    const router = createTestRouter(
      [
        { id: "root", path: "/", Component: () => null },
        { id: "about", path: "/about", Component: () => null },
      ],
      { initialEntries: ["/"] },
    );
    await router.waitForIdle();
    await router.navigate("/about");
    await router.waitForIdle();
    expect(router.pathname()).toBe("/about");
  });

  it("works with expectRoute assertion", async () => {
    const router = createTestRouter([{ id: "home", path: "/", Component: () => null }], {
      initialEntries: ["/"],
    });
    await router.waitForIdle();
    expect(() => expectRoute(router, "/")).not.toThrow();
    expect(() => expectRoute(router, "/dashboard")).toThrow(/expected '\/dashboard'/);
  });

  it("accepts a wildcard pattern via expectRoute", async () => {
    const router = createTestRouter([{ id: "users", path: "/users/:id", Component: () => null }], {
      initialEntries: ["/users/42"],
    });
    await router.waitForIdle();
    expect(() => expectRoute(router, "/users/*")).not.toThrow();
  });

  it("supports expectMatched by route id", async () => {
    const router = createTestRouter(
      [{ id: "dashboard", path: "/dashboard", Component: () => null }],
      { initialEntries: ["/dashboard"] },
    );
    await router.waitForIdle();
    expect(() => expectMatched(router, "dashboard")).not.toThrow();
    expect(() => expectMatched(router, "nonexistent")).toThrow(/not in match chain/);
  });
});
