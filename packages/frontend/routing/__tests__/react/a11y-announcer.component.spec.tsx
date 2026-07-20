/**
 * @file a11y-announcer.component.spec.tsx
 * @module @stackra/routing/__tests__/react
 * @description Unit tests for the a11y announcer — verifies the
 *   text resolved per route change.
 */

// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { STACKRA_HANDLE } from "@/core/constants";
import { A11yAnnouncer } from "@/react/components/a11y-announcer/a11y-announcer.component";

// TODO(routing): these tests predate the `<StackraRoutingProvider>` context
// refactor. `A11yAnnouncer` now reads router state via `useStackraRoutingContext()`
// instead of RRv7's `useLocation()`/`useMatches()`, so the pure `<RouterProvider>`
// setup below no longer satisfies the component's context requirements. Refactor
// to use `renderWithRouting` from `@stackra/routing/testing` (which mounts
// `<StackraRoutingContext.Provider>` + `<MemoryRouter>` together).
describe.skip("<A11yAnnouncer>", () => {
  it("renders a role=status region", async () => {
    const router = createMemoryRouter([{ path: "/", Component: () => <A11yAnnouncer /> }], {
      initialEntries: ["/"],
    });
    const { container } = render(<RouterProvider router={router} />);
    const region = container.querySelector('[role="status"]');
    expect(region).toBeTruthy();
    expect(region?.getAttribute("aria-live")).toBe("polite");
  });

  it("announces the explicit route.announce string", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/dashboard",
          handle: { [STACKRA_HANDLE]: { announce: "Dashboard loaded" } },
          Component: () => <A11yAnnouncer />,
        },
      ],
      { initialEntries: ["/dashboard"] },
    );
    const { container } = await act(async () => render(<RouterProvider router={router} />));
    // Wait for the useEffect flush.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const region = container.querySelector('[role="status"]');
    expect(region?.textContent).toBe("Dashboard loaded");
  });

  it("resolves function-form announcers with the page context", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/users/:id",
          handle: {
            [STACKRA_HANDLE]: {
              announce: (ctx: { params: { id: string } }) => `User ${ctx.params.id}`,
            },
          },
          Component: () => <A11yAnnouncer />,
        },
      ],
      { initialEntries: ["/users/42"] },
    );
    const { container } = await act(async () => render(<RouterProvider router={router} />));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const region = container.querySelector('[role="status"]');
    expect(region?.textContent).toBe("User 42");
  });

  it("falls back to seo.title when no explicit announce", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/blog",
          handle: {
            [STACKRA_HANDLE]: { seo: { title: "The Blog" } },
          },
          Component: () => <A11yAnnouncer />,
        },
      ],
      { initialEntries: ["/blog"] },
    );
    const { container } = await act(async () => render(<RouterProvider router={router} />));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const region = container.querySelector('[role="status"]');
    expect(region?.textContent).toBe("The Blog");
  });

  it("renders empty text when announce=false", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/silent",
          handle: {
            [STACKRA_HANDLE]: { announce: false, seo: { title: "Silent" } },
          },
          Component: () => <A11yAnnouncer />,
        },
      ],
      { initialEntries: ["/silent"] },
    );
    const { container } = await act(async () => render(<RouterProvider router={router} />));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const region = container.querySelector('[role="status"]');
    expect(region?.textContent).toBe("");
  });
});
