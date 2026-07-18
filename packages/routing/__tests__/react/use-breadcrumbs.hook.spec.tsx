/**
 * @file use-breadcrumbs.hook.spec.tsx
 * @module @stackra/routing/__tests__/react
 * @description Unit tests for the breadcrumbs hook — walks the
 *   match chain and produces the ordered trail.
 *
 *   The hook depends on RRv7's `useMatches()` context — we render
 *   a route component that captures the hook's output via a ref
 *   pattern so the test can read the current value.
 */

// @vitest-environment jsdom

import { act } from "react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";

import { useBreadcrumbs } from "@/react/hooks/use-breadcrumbs";
import type { IBreadcrumbEntry } from "@/react/hooks/use-breadcrumbs";

interface ICapture {
  crumbs?: readonly IBreadcrumbEntry[];
}

/**
 * Route body that captures the hook's output — the test reads
 * `capture.crumbs` after render.
 */
function BreadcrumbsCapture({ capture }: { capture: ICapture }): null {
  capture.crumbs = useBreadcrumbs();
  return null;
}

describe("useBreadcrumbs", () => {
  it("produces one entry per match with a breadcrumb handle field", async () => {
    const capture: ICapture = {};
    const router = createMemoryRouter(
      [
        {
          path: "/",
          handle: { breadcrumb: "Home" },
          children: [
            {
              path: "blog",
              handle: { breadcrumb: "Blog" },
              children: [
                {
                  path: ":slug",
                  handle: { breadcrumb: "First" },
                  Component: () => <BreadcrumbsCapture capture={capture} />,
                },
              ],
            },
          ],
        },
      ],
      { initialEntries: ["/blog/first"] },
    );
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    expect(capture.crumbs?.map((c) => c.label)).toEqual(["Home", "Blog", "First"]);
    expect(capture.crumbs?.[capture.crumbs.length - 1].isCurrent).toBe(true);
    expect(capture.crumbs?.[0].isCurrent).toBe(false);
  });

  it("skips matches without a breadcrumb", async () => {
    const capture: ICapture = {};
    const router = createMemoryRouter(
      [
        {
          path: "/",
          children: [
            {
              path: "settings",
              handle: { breadcrumb: "Settings" },
              Component: () => <BreadcrumbsCapture capture={capture} />,
            },
          ],
        },
      ],
      { initialEntries: ["/settings"] },
    );
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    expect(capture.crumbs?.map((c) => c.label)).toEqual(["Settings"]);
  });

  it("resolves function-form breadcrumbs against the page context", async () => {
    const capture: ICapture = {};
    const router = createMemoryRouter(
      [
        {
          path: "/users/:id",
          handle: {
            breadcrumb: (ctx: { params: { id: string } }) => `User ${ctx.params.id}`,
          },
          Component: () => <BreadcrumbsCapture capture={capture} />,
        },
      ],
      { initialEntries: ["/users/42"] },
    );
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    expect(capture.crumbs?.map((c) => c.label)).toEqual(["User 42"]);
  });
});
