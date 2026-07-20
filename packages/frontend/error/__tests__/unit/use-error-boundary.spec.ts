// @vitest-environment jsdom
/**
 * @file use-error-boundary.spec.ts
 * @module @stackra/error/__tests__/unit
 * @description Behavioural spec for `useErrorBoundary()` — the hook
 *   that bridges imperative failures into a React error boundary via
 *   `showBoundary(err)`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { ErrorBoundary } from "@/react/components/error-boundary/error-boundary.component";
import { useErrorBoundary } from "@/react/hooks/use-error-boundary/use-error-boundary.hook";

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

/**
 * Consumer component — mounts a "trigger" button that escalates the
 * given `value` to the nearest boundary via `showBoundary`.
 */
function EscalateOnMount({ value }: { value: unknown }): ReactNode {
  const { showBoundary } = useErrorBoundary();
  // Fire escalation synchronously from a `queueMicrotask` so React
  // is out of the initial render phase — mimics the "async event
  // handler / promise rejection" real-world use-case.
  queueMicrotask(() => showBoundary(value));
  return createElement("div", { "data-testid": "consumer" }, "ok");
}

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

describe("useErrorBoundary", () => {
  it("escalates an Error to the surrounding boundary — fallback replaces the child", async () => {
    const { container, unmount } = mount(
      createElement(ErrorBoundary, {
        fallback: createElement("span", { "data-testid": "fallback" }, "boundary"),
        children: createElement(EscalateOnMount, { value: new Error("escalated") }),
      }),
    );
    // Flush the queued microtask + the follow-up React render.
    await act(async () => {
      await Promise.resolve();
    });
    expect(container.querySelector('[data-testid="fallback"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="consumer"]')).toBeNull();
    unmount();
  });

  it("normalises a non-Error value (string) into an Error before rethrowing", async () => {
    let captured: Error | undefined;
    const { unmount } = mount(
      createElement(ErrorBoundary, {
        onError: (err: Error) => {
          captured = err;
        },
        fallback: createElement("span", null, "boundary"),
        children: createElement(EscalateOnMount, { value: "boom-string" }),
      }),
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(captured).toBeInstanceOf(Error);
    expect(captured?.message).toBe("boom-string");
    unmount();
  });
});
