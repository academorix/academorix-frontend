/**
 * @file render-with-routing.util.spec.tsx
 * @module @stackra/routing/__tests__/testing
 * @description Smoke tests for the `renderWithRouting` helper.
 *
 *   Verifies the three concerns that closed out the dashboard test
 *   failures: the Stackra context resolves for framework hooks
 *   (`useNavigate` / `useStackraRoutingContext`), the react-router
 *   context resolves for the RRv7-native re-exports (`useLocation`),
 *   and the exposed `router` handle is a real `ITestRouter`.
 */

// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import type { ReactElement } from "react";

import { renderWithRouting } from "@/testing/render-with-routing.util";
import { useNavigate, useStackraRoutingContext } from "@/react/hooks";
import { useLocation } from "@/react/react-router-re-exports";

/**
 * Sentinel component — pokes each of the three contexts we care
 * about and renders the result to the DOM so the test can assert on
 * strings.
 */
function StackraContextSentinel(): ReactElement {
  const { router } = useStackraRoutingContext();
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <ul>
      <li data-testid="context-router">{router ? "ok" : "missing"}</li>
      <li data-testid="context-navigate">{typeof navigate}</li>
      <li data-testid="context-location">{location.pathname}</li>
    </ul>
  );
}

describe("renderWithRouting", () => {
  it("mounts the Stackra + react-router contexts so framework hooks resolve", () => {
    renderWithRouting(<StackraContextSentinel />, {
      initialEntries: ["/dashboard"],
    });

    // `router` from the Stackra context — non-null when the provider
    // mounts.
    expect(screen.getByTestId("context-router").textContent).toBe("ok");

    // `useNavigate` returns a callable; the helper turns
    // it into a stable function reference for the test's lifetime.
    expect(screen.getByTestId("context-navigate").textContent).toBe("function");

    // `useLocation` from react-router resolves — the `<MemoryRouter>`
    // wrapper published the initial entry.
    expect(screen.getByTestId("context-location").textContent).toBe("/dashboard");
  });

  it("returns the programmatic test router alongside the render result", async () => {
    const result = renderWithRouting(<StackraContextSentinel />, {
      initialEntries: ["/"],
    });

    // The test router is a real `ITestRouter` — has the helpers.
    expect(typeof result.router.navigate).toBe("function");
    expect(typeof result.router.waitForIdle).toBe("function");
    expect(typeof result.router.pathname).toBe("function");
    expect(result.router.pathname()).toBe("/");
  });

  it("defaults initialEntries to ['/']", () => {
    renderWithRouting(<StackraContextSentinel />);

    expect(screen.getByTestId("context-location").textContent).toBe("/");
  });
});
