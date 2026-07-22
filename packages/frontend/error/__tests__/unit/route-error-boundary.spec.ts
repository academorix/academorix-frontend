// @vitest-environment jsdom
/**
 * @file route-error-boundary.spec.ts
 * @module @stackra/error/__tests__/unit
 * @description Behavioural spec for `RouteErrorBoundary` — the React
 *   Router `errorElement` integration. Uses a memory router so we can
 *   trigger the error branches (thrown Response for 404/500, thrown
 *   plain Error, and non-Error thrown values) without hitting network.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import { RouteErrorBoundary } from "@/router/route-error-boundary/route-error-boundary.component";

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

function mount(tree: ReactNode): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(tree);
  });
  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

/** Small helper to build a memory router where the root loader throws. */
function buildRouterThatThrows(loaderThrow: () => never) {
  return createMemoryRouter(
    [
      {
        path: "/",
        loader: loaderThrow,
        element: createElement("span", null, "ok"),
        // The RouteErrorBoundary catches the loader-thrown value via
        // `useRouteError` and renders the DefaultErrorFallback.
        errorElement: createElement(RouteErrorBoundary),
      },
    ],
    { initialEntries: ["/"] },
  );
}

/** Wait one tick — the memory router resolves its loader asynchronously. */
async function flush(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

// ────────────────────────────────────────────────────────────────────────
// Global setup
// ────────────────────────────────────────────────────────────────────────

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  consoleWarnSpy.mockRestore();
});

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe("RouteErrorBoundary", () => {
  it('renders a formatted "STATUS statusText" heading when the loader throws a Response', async () => {
    // React Router treats a thrown `Response` as a special route
    // error (`isRouteErrorResponse` returns true). The boundary
    // extracts status + statusText into the heading.
    const router = buildRouterThatThrows(() => {
      throw new Response("Missing resource", { status: 404, statusText: "Not Found" });
    });
    const { container, unmount } = mount(createElement(RouterProvider, { router }));
    await flush();
    // Heading contains both the status code and the statusText.
    expect(container.textContent).toContain("404");
    expect(container.textContent).toContain("Not Found");
    // The string body reaches the fallback's description.
    expect(container.textContent).toContain("Missing resource");
    unmount();
  });

  it("renders the DefaultErrorFallback with the message when the loader throws a plain Error", async () => {
    const router = buildRouterThatThrows(() => {
      throw new Error("loader-broke");
    });
    const { container, unmount } = mount(createElement(RouterProvider, { router }));
    await flush();
    expect(container.textContent).toContain("loader-broke");
    unmount();
  });

  it("normalises a non-Error thrown value (string) before rendering", async () => {
    const router = buildRouterThatThrows(() => {
      // Loader throws a string — normalised into `new Error('boom')`.
      throw "boom" as unknown as never;
    });
    const { container, unmount } = mount(createElement(RouterProvider, { router }));
    await flush();
    expect(container.textContent).toContain("boom");
    unmount();
  });
});
