// @vitest-environment jsdom
/**
 * @file testing-helpers.spec.ts
 * @module @stackra/error/__tests__/unit
 * @description Behavioural spec for the `@stackra/error/testing` surface —
 *   `MockErrorRecorder`, `MockFallback`, and `createMockErrorBoundary`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { MockErrorRecorder } from "@/testing/mock-error-recorder";
import { MockFallback } from "@/testing/mock-fallback";
import { createMockErrorBoundary } from "@/testing/create-mock-error-boundary";

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

function Boom(): ReactNode {
  throw new Error("boom");
}

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
});

// ────────────────────────────────────────────────────────────────────────
// MockErrorRecorder
// ────────────────────────────────────────────────────────────────────────

describe("MockErrorRecorder", () => {
  it("captures errors + info via the `handler` in registration order", () => {
    const recorder = new MockErrorRecorder();
    const info1 = { componentStack: "\n  at A" };
    const info2 = { componentStack: "\n  at B" };
    recorder.handler(new Error("one"), info1);
    recorder.handler(new Error("two"), info2);
    expect(recorder.errors).toHaveLength(2);
    expect(recorder.errors[0].error.message).toBe("one");
    expect(recorder.errors[1].info?.componentStack).toBe("\n  at B");
  });

  it("exposes the most recent capture via `.last`", () => {
    const recorder = new MockErrorRecorder();
    expect(recorder.last).toBeUndefined();
    recorder.record(new Error("x"));
    recorder.record(new Error("y"));
    expect(recorder.last?.message).toBe("y");
  });

  it("collects component stacks via `.componentStacks`", () => {
    const recorder = new MockErrorRecorder();
    recorder.record(new Error("a"), { componentStack: "A" });
    recorder.record(new Error("b"), undefined);
    // Every capture is projected — missing info yields `null`.
    expect(recorder.componentStacks).toEqual(["A", null]);
  });

  it("reset() drops every capture", () => {
    const recorder = new MockErrorRecorder();
    recorder.record(new Error("x"));
    recorder.reset();
    expect(recorder.errors).toHaveLength(0);
    expect(recorder.last).toBeUndefined();
  });
});

// ────────────────────────────────────────────────────────────────────────
// MockFallback
// ────────────────────────────────────────────────────────────────────────

describe("MockFallback", () => {
  it('renders the error message under the default `data-testid="mock-fallback"`', () => {
    const { container, unmount } = mount(
      createElement(MockFallback, {
        error: new Error("displayed"),
        reset: () => undefined,
      }),
    );
    const root = container.querySelector('[data-testid="mock-fallback"]');
    expect(root).not.toBeNull();
    expect(root?.getAttribute("role")).toBe("alert");
    expect(container.querySelector('[data-testid="mock-fallback-message"]')?.textContent).toBe(
      "displayed",
    );
    expect(container.querySelector('[data-testid="mock-fallback-reset"]')).not.toBeNull();
    unmount();
  });

  it("honours a custom `testId` prefix on every emitted element", () => {
    const { container, unmount } = mount(
      createElement(MockFallback, {
        error: new Error("scoped"),
        reset: () => undefined,
        testId: "boundary-x",
      }),
    );
    expect(container.querySelector('[data-testid="boundary-x"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="boundary-x-message"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="boundary-x-reset"]')).not.toBeNull();
    unmount();
  });

  it("records into the supplied recorder on every render", () => {
    // The fallback records the error into the recorder synchronously
    // as part of its render. It runs once per render, so a re-render
    // increments the recorder count.
    const recorder = new MockErrorRecorder();
    const err = new Error("recorded");
    const { unmount } = mount(
      createElement(MockFallback, { error: err, reset: () => undefined, recorder }),
    );
    expect(recorder.last).toBe(err);
    unmount();
  });

  it("omits the reset button when no `reset` prop is provided", () => {
    const { container, unmount } = mount(
      createElement(MockFallback, {
        error: new Error("no-reset"),
        reset: undefined as unknown as () => void,
      }),
    );
    expect(container.querySelector('[data-testid="mock-fallback-reset"]')).toBeNull();
    unmount();
  });
});

// ────────────────────────────────────────────────────────────────────────
// createMockErrorBoundary
// ────────────────────────────────────────────────────────────────────────

describe("createMockErrorBoundary", () => {
  it("returns a boundary component pre-wired to a fresh recorder", () => {
    const { MockErrorBoundary, recorder } = createMockErrorBoundary();
    const { container, unmount } = mount(
      createElement(MockErrorBoundary, { children: createElement(Boom) }),
    );
    // Default fallback is MockFallback — it renders in the DOM…
    expect(container.querySelector('[data-testid="mock-fallback"]')).not.toBeNull();
    // …and the recorder saw the error via the boundary's onError.
    expect(recorder.last?.message).toBe("boom");
    unmount();
  });

  it("forwards a caller-supplied `onError` alongside the recorder", () => {
    const { MockErrorBoundary, recorder } = createMockErrorBoundary();
    const onError = vi.fn();
    const { unmount } = mount(
      createElement(MockErrorBoundary, { onError, children: createElement(Boom) }),
    );
    // Both callbacks fire — the mock records AND the caller's
    // handler is invoked.
    expect(recorder.last?.message).toBe("boom");
    expect(onError).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("accepts a custom fallback that overrides the default MockFallback", () => {
    const { MockErrorBoundary } = createMockErrorBoundary();
    const { container, unmount } = mount(
      createElement(MockErrorBoundary, {
        fallback: createElement("span", { "data-testid": "custom-fallback" }, "custom"),
        children: createElement(Boom),
      }),
    );
    // Custom fallback wins.
    expect(container.querySelector('[data-testid="custom-fallback"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="mock-fallback"]')).toBeNull();
    unmount();
  });

  it("produces independent recorders across factory calls", () => {
    const a = createMockErrorBoundary();
    const b = createMockErrorBoundary();
    a.recorder.record(new Error("x"));
    // `b.recorder` MUST not see any of `a`'s records — the factory
    // creates a fresh recorder per invocation.
    expect(b.recorder.errors).toHaveLength(0);
  });
});
