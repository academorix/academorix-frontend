/**
 * @file create-test-router.util.ts
 * @module @stackra/routing/testing
 * @description Programmatic test router (per PLAN v3.11.5).
 *
 *   Builds an RRv7 `MemoryRouter` and wires the same middleware
 *   attachment pipeline the production provider uses. Tests read
 *   `router.state.location.pathname`, `router.state.matches`, etc.
 *   Assertion helpers (`expectRoute`, `expectMatched`) build on top.
 */

import type { IApplication, IRouteRecord } from "@stackra/contracts";
import { createMemoryRouter } from "react-router";

import { attachMiddleware } from "@/react/attach-middleware/attach-middleware.util";
import { toRrv7Routes } from "@/react/adapt-page-module/to-rrv7-routes.util";
import type { IStackraRouter } from "@/react/contexts";

import { createMockContainer } from "./create-mock-container.util";

/**
 * Options accepted by `createTestRouter`.
 */
export interface ICreateTestRouterOptions {
  /** Initial history stack. Defaults to `['/']`. */
  readonly initialEntries?: readonly string[];

  /** Initial index into the entry stack. Defaults to the last entry. */
  readonly initialIndex?: number;

  /**
   * DI container. When omitted, a fresh `createMockContainer()` is
   * used. Guard / middleware tests should pass a real container so
   * `MIDDLEWARE_RESOLVER` and friends are wired.
   */
  readonly container?: IApplication;
}

/**
 * The programmatic test router — a thin wrapper over the RRv7
 * memory-router with two helpers: `navigate(to)` (a `Promise`-based
 * alias) and `waitForIdle()` (yield until pending navigations
 * resolve).
 */
export interface ITestRouter {
  /** Underlying RRv7 data-router. */
  readonly router: IStackraRouter;

  /** Navigate the router to `to`. */
  readonly navigate: (to: string | number) => Promise<void>;

  /**
   * Wait until every in-flight navigation / fetcher settles.
   * `router.state.navigation.state === 'idle'` means no work is in
   * flight; the helper polls once per microtask until the flag flips.
   */
  readonly waitForIdle: () => Promise<void>;

  /** Snapshot the current pathname. */
  readonly pathname: () => string;
}

/**
 * Build a programmatic test router.
 *
 * @param routes - Route tree the test wants to exercise.
 * @param options - Optional overrides.
 * @returns Test router with helpers.
 *
 * @example
 * ```typescript
 * const router = createTestRouter(routes, {initialEntries: ['/dashboard']});
 * await router.waitForIdle();
 * expect(router.pathname()).toBe('/dashboard');
 * ```
 */
export function createTestRouter(
  routes: readonly IRouteRecord[],
  options: ICreateTestRouterOptions = {},
): ITestRouter {
  const initialEntries = options.initialEntries ?? ["/"];
  const initialIndex = options.initialIndex ?? initialEntries.length - 1;
  const container = options.container ?? (createMockContainer() as unknown as IApplication);

  // Same pipeline as the production provider — adapter + middleware
  // attach + memory router. Tests exercise the real code path.
  const rrv7Tree = toRrv7Routes(routes);
  // Only attach middleware if the container has a resolver wired —
  // tests that only need path matching can omit the resolver.
  let wired = rrv7Tree;
  try {
    wired = attachMiddleware(rrv7Tree, container, "client");
  } catch {
    // fail-soft — the caller opted out of the middleware pipeline.
  }

  const router: IStackraRouter = createMemoryRouter(wired, {
    initialEntries: initialEntries as string[],
    initialIndex,
  }) as IStackraRouter;

  return {
    router,
    navigate: async (to) => {
      await router.navigate(to as never);
    },
    waitForIdle: async () => {
      // Yield until navigation state is idle. `router.state` is a
      // read-only snapshot; subscribing would leak — a microtask loop
      // is enough for tests.
      const maxIter = 100;
      for (let i = 0; i < maxIter; i += 1) {
        const state = router.state;
        if (state.navigation.state === "idle" && state.revalidation === "idle") {
          return;
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise<void>((resolve) => queueMicrotask(resolve));
      }
    },
    pathname: () => router.state.location.pathname,
  };
}
