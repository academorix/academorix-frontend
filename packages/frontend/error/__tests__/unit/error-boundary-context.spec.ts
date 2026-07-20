// @vitest-environment jsdom
/**
 * @file error-boundary-context.spec.ts
 * @module @stackra/error/__tests__/unit
 * @description Behavioural spec for `ErrorBoundaryContext` and the
 *   consumer hook `useErrorBoundaryContext`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { ErrorBoundary } from "@/react/components/error-boundary/error-boundary.component";
import {
  ErrorBoundaryContext,
  useErrorBoundaryContext,
} from "@/react/context/error-boundary-context";

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

/** Child that always throws so the boundary is guaranteed to be in
 *  its fallback branch during the test. */
function BoomChild(): ReactNode {
  throw new Error("always");
}

/** Consumer that reads the context and exposes the values on the DOM. */
function ContextReader(): ReactNode {
  const ctx = useErrorBoundaryContext();
  return createElement(
    "div",
    { "data-testid": "ctx" },
    createElement("span", { "data-testid": "ctx-error" }, ctx.error?.message),
    createElement(
      "button",
      { "data-testid": "ctx-reset", type: "button", onClick: () => ctx.reset() },
      "reset-from-context",
    ),
  );
}

// ────────────────────────────────────────────────────────────────────────
// Global setup
// ────────────────────────────────────────────────────────────────────────

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe("ErrorBoundaryContext", () => {
  it("carries a `displayName` so React DevTools identifies it", () => {
    // The component sets it explicitly on the exported Context.
    expect(ErrorBoundaryContext.displayName).toBe("ErrorBoundaryContext");
  });
});

describe("useErrorBoundaryContext", () => {
  it("throws when called outside an <ErrorBoundary> fallback subtree", () => {
    // The hook is documented to throw in this case — the error
    // surfaces during React's render phase, so we capture it via
    // `act`'s error catch (React re-throws it once the tree
    // finishes). We wrap the consumer in a boundary that grabs the
    // error before it propagates further.
    let captured: Error | undefined;
    const { unmount } = mount(
      createElement(ErrorBoundary, {
        onError: (err: Error) => {
          captured = err;
        },
        fallback: createElement("span", null, "caught"),
        // The reader is NOT inside a fallback subtree (no error yet)
        // — so the hook MUST throw.
        children: createElement(ContextReader),
      }),
    );
    expect(captured).toBeInstanceOf(Error);
    expect(captured?.message).toMatch(/must be used within an <ErrorBoundary> fallback subtree/);
    unmount();
  });

  it("returns the caught error + reset handle to the fallback subtree", () => {
    // Place the reader INSIDE the fallback — it should read the
    // captured error from the boundary's Provider.
    const { container, unmount } = mount(
      createElement(ErrorBoundary, {
        fallback: createElement(ContextReader),
        children: createElement(BoomChild),
      }),
    );
    const errorEl = container.querySelector('[data-testid="ctx-error"]');
    const resetButton = container.querySelector('[data-testid="ctx-reset"]');
    expect(errorEl?.textContent).toBe("always");
    expect(resetButton).not.toBeNull();
    unmount();
  });
});
