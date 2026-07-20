/**
 * @file routing-test-frame.util.tsx
 * @module @stackra/routing/testing
 * @description JSX-component form of the routing test context.
 *
 *   Wraps `children` in the same three providers that
 *   {@link renderWithRouting} sets up:
 *
 *     1. `<ContainerProvider>` from `@stackra/container/react`.
 *     2. `<StackraRoutingContext.Provider>` — the Stackra routing
 *        context so every hook re-exported from
 *        `@stackra/routing/react` (`useNavigate`,
 *        `useStackraRoutingContext`, `useBack`, …) resolves.
 *     3. `<MemoryRouter>` from `react-router` — the legacy
 *        declarative router providing the react-router context so
 *        the RRv7-native re-exports (`useLocation`, `useMatches`,
 *        `useHref`, …) also resolve.
 *
 *   Consumers reach for this JSX form when they need a `wrapper`
 *   for `@testing-library/react`'s `renderHook(...)` — the
 *   function-form `renderWithRouting` is not composable inside a
 *   `renderHook` wrapper because `renderHook` mounts its own render
 *   root, not a `ReactElement`.
 */

import type { IApplication, IRouteRecord, IRoutingModuleOptions } from "@stackra/contracts";
import { ContainerProvider } from "@stackra/container/react";
import { useMemo, type ReactElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router";

import { DEFAULT_ROUTING_CONFIG } from "@/core/constants";
// IMPORTANT — import from the PUBLIC subpath `@stackra/routing/react`
// (not the internal `@/react/contexts` path alias). The tsup config
// externalises `@stackra/routing/react` for this entry so
// `dist/testing.mjs` shares the same `StackraRoutingContext` object
// as `dist/react.mjs` at runtime; a `@/react/contexts` import would
// inline a second `createContext(null)` into `testing.mjs` and
// consumer hooks would read from the wrong context.
import { StackraRoutingContext } from "@stackra/routing/react";

import { createMockContainer } from "./create-mock-container.util";
import {
  createTestRouter,
  type ICreateTestRouterOptions,
} from "./create-test-router.util";

/**
 * Props accepted by {@link RoutingTestFrame}.
 */
export interface IRoutingTestFrameProps {
  /** Content mounted inside the routing context. */
  readonly children: ReactNode;

  /**
   * Route tree seeded into the test router. Defaults to a single
   * catch-all record that renders nothing — the framework hooks
   * still need a router instance to reference on the context.
   */
  readonly routes?: readonly IRouteRecord[];

  /**
   * Initial history stack for both the RRv7 test router AND the
   * `<MemoryRouter>` wrapper. Defaults to `['/']`.
   */
  readonly initialEntries?: readonly string[];

  /**
   * Index into `initialEntries` for both routers. Defaults to the
   * last entry.
   */
  readonly initialIndex?: number;

  /**
   * Extra options forwarded to {@link createTestRouter}.
   */
  readonly router?: Omit<ICreateTestRouterOptions, "initialEntries" | "initialIndex">;

  /**
   * DI container published on `<ContainerProvider>` + the Stackra
   * context. Defaults to a fresh {@link createMockContainer}.
   *
   * Named `app` (not `container`) so consumers can spot it as
   * "application context" rather than "DOM container".
   */
  readonly app?: IApplication;

  /**
   * Merged routing config published on the Stackra context.
   * Defaults to `DEFAULT_ROUTING_CONFIG`.
   */
  readonly config?: IRoutingModuleOptions;
}

/**
 * JSX wrapper that mounts the routing test context.
 *
 * @param props - See {@link IRoutingTestFrameProps}.
 * @returns The wrapped React tree.
 *
 * @example
 * ```tsx
 * import { RoutingTestFrame } from '@stackra/routing/testing';
 * import { renderHook } from '@testing-library/react';
 *
 * renderHook(() => useNavigate(), {
 *   wrapper: ({children}) => <RoutingTestFrame>{children}</RoutingTestFrame>,
 * });
 * ```
 */
export function RoutingTestFrame(props: IRoutingTestFrameProps): ReactElement {
  const {
    children,
    routes,
    initialEntries = ["/"],
    initialIndex,
    router: routerOptions,
    app: appOption,
    config: configOption,
  } = props;

  // 1. Resolve the DI container. When omitted, a fresh mock stands
  //    in — get/getOptional/has answer the routing hooks that need
  //    a container reference on the context.
  const container = useMemo<IApplication>(
    () => appOption ?? (createMockContainer() as unknown as IApplication),
    [appOption],
  );

  // 2. Build the programmatic test router. Routes are OPTIONAL — for
  //    most unit tests the component doesn't actually reach a routed
  //    page. RRv7 rejects an empty routes array, so when the caller
  //    supplies none we seed a single catch-all record that renders
  //    nothing.
  const testRouter = useMemo(() => {
    const seededRoutes: readonly IRouteRecord[] =
      routes && routes.length > 0
        ? routes
        : [{ id: "__routingTestFrame__catch_all", path: "*", Component: (): null => null }];
    return createTestRouter(seededRoutes, {
      initialEntries,
      initialIndex,
      container: routerOptions?.container ?? container,
    });
    // The router is built once per mount — see the empty-deps note
    // in the JSX return.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const config = configOption ?? DEFAULT_ROUTING_CONFIG;

  // Memoise the context value so consumers of the context don't
  // re-render on parent re-renders. Every field is stable for the
  // lifetime of the mount.
  const contextValue = useMemo(
    () => ({
      container,
      config,
      router: testRouter.router,
    }),
    [container, config, testRouter],
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
          {children}
        </MemoryRouter>
      </StackraRoutingContext.Provider>
    </ContainerProvider>
  );
}
