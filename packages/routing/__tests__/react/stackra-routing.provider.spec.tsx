/**
 * @file stackra-routing.provider.spec.tsx
 * @module @stackra/routing/__tests__/react
 * @description Unit tests for the `<StackraRoutingProvider>`.
 *
 *   Verifies end-to-end that the provider:
 *     1. Reads routes from the `routes` prop when set.
 *     2. Constructs a memory router (via `kind: 'memory'`).
 *     3. Renders the initial route's component.
 */

// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { ApplicationFactory, Module } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";

import { RoutingModule } from "@/core/routing.module";
import { StackraRoutingProvider } from "@/react/providers/stackra-routing/stackra-routing.provider";

/** Bare-bones app module — imports the routing module. */
@Module({
  imports: [RoutingModule.forRoot({ basename: "/" })],
})
class TestAppModule {}

describe("<StackraRoutingProvider>", () => {
  it("mounts a memory router and renders the initial route", async () => {
    const app = await ApplicationFactory.create(TestAppModule);
    const routes = [
      {
        path: "/",
        Component: () => <div data-testid="home">Home</div>,
      },
    ];
    const { getByTestId } = await act(async () =>
      render(
        <ContainerProvider context={app}>
          <StackraRoutingProvider
            app={app as never}
            routes={routes}
            kind="memory"
            opts={{ initialEntries: ["/"] }}
            a11yAnnouncer={false}
          />
        </ContainerProvider>,
      ),
    );
    // Allow the router to settle.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(getByTestId("home").textContent).toBe("Home");
  });

  it("throws when no container is resolvable", async () => {
    // Clear the global container so the fallback lookup misses.
    const { clearGlobalApplicationContext } = await import("@stackra/container");
    clearGlobalApplicationContext();
    expect(() =>
      render(<StackraRoutingProvider app={undefined} routes={[{ path: "/" }]} kind="memory" />),
    ).toThrow(/no application container found/);
  });
});
