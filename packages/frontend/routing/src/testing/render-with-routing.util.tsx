/**
 * @file render-with-routing.util.tsx
 * @module @stackra/routing/testing
 * @description Render a React tree with the routing framework's
 *   contexts already mounted.
 *
 *   Consumers use this INSTEAD of `<MemoryRouter>` from `react-router`
 *   in unit tests. The rendered tree carries three providers:
 *
 *     1. `<ContainerProvider>` from `@stackra/container/react` — so
 *        `useInject` + service consumers resolve.
 *     2. `<StackraRoutingContext.Provider>` — so every hook re-exported
 *        from `@stackra/routing/react` (`useNavigate`,
 *        `useStackraRoutingContext`, `useBack`, `useCanGoBack`, …) works
 *        without spinning up a real `<StackraRoutingProvider>`.
 *     3. `<MemoryRouter>` from `react-router` — provides the react-router
 *        context so the RRv7-native re-exports (`useLocation`,
 *        `useMatches`, `useHref`, …) also work.
 *
 *   The helper deliberately does NOT mount `<RouterProvider>` — that
 *   would kick off loaders / hydration / RRv7 data-router work which
 *   is out of scope for unit tests.
 *
 *   When you need a JSX WRAPPER (for `renderHook`'s `wrapper`
 *   option), reach for {@link RoutingTestFrame} directly.
 */

import type { IApplication, IRouteRecord, IRoutingModuleOptions } from "@stackra/contracts";
import { ContainerProvider } from "@stackra/container/react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { useMemo, type ComponentType, type ReactElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router";

import { DEFAULT_ROUTING_CONFIG } from "@/core/constants";
// IMPORTANT — import from the PUBLIC subpath `@stackra/routing/react`
// (not the internal `@/react/contexts` path alias). See the matching
// note in `routing-test-frame.util.tsx` — externalising the subpath
// keeps `dist/testing.mjs` and `dist/react.mjs` sharing the same
// `StackraRoutingContext` instance at runtime.
import { StackraRoutingContext } from "@stackra/routing/react";

import type { ICreateTestRouterOptions, ITestRouter } from "./create-test-router.util";
import { createTestRouter } from "./create-test-router.util";
import { createMockContainer } from "./create-mock-container.util";

/**
 * Options accepted by {@link renderWithRouting}.
 *
 * Extends `RenderOptions` from `@testing-library/react`; every render-
 * library option (`baseElement`, `container`, `hydrate`, `wrapper`)
 * passes straight through.
 */
export interface IRenderWithRoutingOptions extends RenderOptions {
  /**
   * Route tree to seed the test router with. Defaults to a single
   * catch-all record — the framework hooks still need a router
   * instance to reference on the context, but the component under
   * test is normally rendered directly rather than reached through
   * routing.
   */
  readonly routes?: readonly IRouteRecord[];

  /**
   * Initial history stack for both the RRv7 test router AND the
   * `<MemoryRouter>` wrapper. Defaults to `['/']`.
   */
  readonly initialEntries?: readonly string[];

  /**
   * Index into `initialEntries` for both routers. Defaults to the
   * last entry (matching `<MemoryRouter>` semantics).
   */
  readonly initialIndex?: number;

  /**
   * Extra options forwarded to `createTestRouter`. Use to inject a
   * container that already has middleware / guard resolvers wired.
   * When both `router.container` here and top-level `app` are set,
   * this one wins for the RRv7 router construction; the top-level
   * value populates the Stackra context.
   */
  readonly router?: Omit<ICreateTestRouterOptions, "initialEntries" | "initialIndex">;

  /**
   * DI container published on `<ContainerProvider>` + the Stackra
   * context. Defaults to a fresh {@link createMockContainer}.
   *
   * Named `app` (not `container`) so it doesn't collide with
   * `RenderOptions.container` — the DOM container Testing Library
   * mounts into.
   */
  readonly app?: IApplication;

  /**
   * Merged routing config published on the Stackra context.
   * Defaults to `DEFAULT_ROUTING_CONFIG`.
   */
  readonly config?: IRoutingModuleOptions;
}

/**
 * Return shape of {@link renderWithRouting}.
 *
 * Extends `RenderResult` (rerender, unmount, getByRole, etc.) with
 * the programmatic test router so tests that need to observe
 * navigation state (`router.pathname()`, `router.waitForIdle()`) can
 * reach it.
 */
export interface IRenderWithRoutingResult extends RenderResult {
  /** Programmatic test router driving the mounted Stackra context. */
  readonly router: ITestRouter;
}

/**
 * Render `ui` inside the routing framework's minimal test context.
 *
 * Every routing hook re-exported from `@stackra/routing/react`
 * (`useNavigate`, `useStackraRoutingContext`, `useBack`, …) works
 * inside the returned tree. React-router's legacy `<MemoryRouter>`
 * wraps the content too, so RRv7-native re-exports (`useLocation`,
 * `useMatches`, `useHref`, `useInRouterContext`) also work.
 *
 * @param ui      - React element to render.
 * @param options - Optional render + routing overrides.
 * @returns Testing-library render result augmented with `router`.
 *
 * @example
 * ```tsx
 * import { renderWithRouting } from '@stackra/routing/testing';
 *
 * import { MyPage } from './my-page';
 *
 * renderWithRouting(<MyPage />, {initialEntries: ['/dashboard']});
 * ```
 */
export function renderWithRouting(
  ui: ReactElement,
  options: IRenderWithRoutingOptions = {},
): IRenderWithRoutingResult {
  const {
    routes,
    initialEntries = ["/"],
    initialIndex,
    router: routerOptions,
    app: appOption,
    config: configOption,
    ...renderOptions
  } = options;

  // 1. Resolve the DI container. When omitted, a fresh mock stands
  //    in — get/getOptional/has answer the routing hooks that need
  //    a container reference on the context.
  const container = appOption ?? (createMockContainer() as unknown as IApplication);

  // 2. Build the programmatic test router. Routes are OPTIONAL — for
  //    most unit tests the component doesn't reach a routed page,
  //    but the framework hooks still need a router instance. RRv7
  //    rejects an empty routes array, so seed a single catch-all
  //    when the caller supplies none.
  const seededRoutes: readonly IRouteRecord[] =
    routes && routes.length > 0
      ? routes
      : [{ id: "__renderWithRouting__catch_all", path: "*", Component: (): null => null }];

  const testRouter = createTestRouter(seededRoutes, {
    initialEntries,
    initialIndex,
    container: routerOptions?.container ?? container,
  });

  // 3. Fall back to the package's default routing config when the
  //    caller doesn't override — matches what
  //    `<StackraRoutingProvider>` does when `ROUTING_CONFIG` is
  //    unwired on the container.
  const config = configOption ?? DEFAULT_ROUTING_CONFIG;

  // 4. Preserve a caller-supplied wrapper by composing it INSIDE
  //    the routing frame — the caller's wrapper wraps the UI; our
  //    routing frame wraps the caller's wrapper.
  const CallerWrapper = renderOptions.wrapper as ComponentType<{ children: ReactNode }> | undefined;

  const Wrapper = ({ children }: { children: ReactNode }): ReactElement => {
    // Memoise the context value so re-renders of the wrapper don't
    // re-materialise the object identity — otherwise every context
    // consumer would re-render on every parent render.
    const contextValue = useMemo(
      () => ({
        container,
        config,
        router: testRouter.router,
      }),
      // The three inputs are stable for the test's lifetime —
      // rebuilding on mount only.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    return (
      <ContainerProvider context={container as never}>
        <StackraRoutingContext.Provider value={contextValue}>
          {/*
            `<MemoryRouter>` is the legacy declarative router — no
            loaders, no data-router transitions. Provides the
            react-router context so `useLocation` / `useMatches` /
            `useHref` work under the tree.
          */}
          <MemoryRouter initialEntries={initialEntries as string[]} initialIndex={initialIndex}>
            {CallerWrapper ? <CallerWrapper>{children}</CallerWrapper> : children}
          </MemoryRouter>
        </StackraRoutingContext.Provider>
      </ContainerProvider>
    );
  };

  const result = render(ui, {
    ...renderOptions,
    wrapper: Wrapper,
  });

  return {
    ...result,
    router: testRouter,
  };
}
