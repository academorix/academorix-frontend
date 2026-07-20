// @vitest-environment jsdom
/**
 * @file error-boundary.spec.ts
 * @module @stackra/error/__tests__/unit
 * @description Behavioural spec for the base `ErrorBoundary` class
 *   component.
 *
 *   The package does NOT depend on `@testing-library/react`, so this
 *   spec drives the component through the low-level `react-dom/client`
 *   API on a jsdom-provided DOM. Every render is wrapped in
 *   `act(...)` so React 19's concurrent rendering settles before we
 *   assert against the DOM.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, StrictMode, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

import { ErrorBoundary } from "@/react/components/error-boundary/error-boundary.component";

// ────────────────────────────────────────────────────────────────────────
// Test-only components + helpers
// ────────────────────────────────────────────────────────────────────────

/**
 * Simple render helper — mounts a subtree into a fresh container and
 * returns handles to re-render / unmount.
 *
 * Wraps the initial mount in `act(...)`. Consumers call `rerender(next)`
 * for updates and `unmount()` for cleanup (also test-driver friendly).
 */
function mount(tree: ReactNode): {
  container: HTMLDivElement;
  root: Root;
  rerender: (next: ReactNode) => void;
  unmount: () => void;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  // React 19 requires a synchronous act() around the initial render
  // so its concurrent scheduler doesn't defer effects past the test.
  act(() => {
    root.render(tree);
  });

  const rerender = (next: ReactNode): void => {
    act(() => {
      root.render(next);
    });
  };
  const unmount = (): void => {
    act(() => {
      root.unmount();
    });
    container.remove();
  };

  return { container, root, rerender, unmount };
}

/**
 * Child that throws with `errorMessage` when `shouldThrow` is true.
 * Lets tests toggle the throw between renders (via `resetKeys` or
 * imperative reset).
 */
function ThrowIf({
  shouldThrow,
  errorMessage = "boom",
}: {
  shouldThrow: boolean;
  errorMessage?: string;
}): ReactNode {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return createElement("div", { "data-testid": "child-ok" }, "child-rendered");
}

/**
 * Static fallback marker — used when a spec just needs to prove the
 * boundary is in its fallback branch.
 */
function StaticFallback(): ReactNode {
  return createElement("div", { "data-testid": "fallback" }, "fallback-shown");
}

// ────────────────────────────────────────────────────────────────────────
// Global setup
// ────────────────────────────────────────────────────────────────────────

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // React logs every caught boundary error via `console.error`. Silence
  // it so the test output isn't polluted; every spec that needs to
  // assert on the error can inspect the spy directly.
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

// ────────────────────────────────────────────────────────────────────────
// Specs — happy path
// ────────────────────────────────────────────────────────────────────────

describe("ErrorBoundary — rendering", () => {
  it("renders children when the subtree does not throw", () => {
    const { container, unmount } = mount(
      createElement(ErrorBoundary, {
        children: createElement(ThrowIf, { shouldThrow: false }),
      }),
    );
    expect(container.querySelector('[data-testid="child-ok"]')).not.toBeNull();
    expect(container.textContent).toContain("child-rendered");
    unmount();
  });

  it("renders a static ReactNode fallback when a child throws", () => {
    const { container, unmount } = mount(
      createElement(ErrorBoundary, {
        fallback: createElement(StaticFallback),
        children: createElement(ThrowIf, { shouldThrow: true }),
      }),
    );
    expect(container.querySelector('[data-testid="fallback"]')).not.toBeNull();
    expect(container.textContent).toContain("fallback-shown");
    unmount();
  });

  it("invokes a render-function fallback with the caught error and a reset callback", () => {
    // The render-function form receives `({ error, reset })`. Assert
    // both — the error is the thrown one, `reset` is a callable.
    let capturedError: Error | undefined;
    let capturedReset: (() => void) | undefined;

    const { container, unmount } = mount(
      createElement(ErrorBoundary, {
        fallback: ({ error, reset }: { error: Error; reset: () => void }) => {
          capturedError = error;
          capturedReset = reset;
          return createElement("span", { "data-testid": "render-fn-fallback" }, error.message);
        },
        children: createElement(ThrowIf, { shouldThrow: true, errorMessage: "kaboom" }),
      }),
    );

    const el = container.querySelector('[data-testid="render-fn-fallback"]');
    expect(el).not.toBeNull();
    expect(el?.textContent).toBe("kaboom");
    expect(capturedError).toBeInstanceOf(Error);
    expect(capturedError?.message).toBe("kaboom");
    expect(typeof capturedReset).toBe("function");
    unmount();
  });

  it("renders `null` on error when no `fallback` prop is provided", () => {
    // The class explicitly falls back to `null` when neither a
    // ReactNode nor a render function is supplied.
    const { container, unmount } = mount(
      createElement(ErrorBoundary, {
        children: createElement(ThrowIf, { shouldThrow: true }),
      }),
    );
    // Nothing rendered — the container has no visible children.
    expect(container.textContent).toBe("");
    unmount();
  });
});

// ────────────────────────────────────────────────────────────────────────
// Specs — onError / componentDidCatch
// ────────────────────────────────────────────────────────────────────────

describe("ErrorBoundary — onError callback", () => {
  it("fires `onError(error, info)` exactly once with the caught error and React error info", () => {
    const onError = vi.fn();
    const { unmount } = mount(
      createElement(ErrorBoundary, {
        onError,
        fallback: createElement(StaticFallback),
        children: createElement(ThrowIf, { shouldThrow: true, errorMessage: "reported" }),
      }),
    );
    expect(onError).toHaveBeenCalledTimes(1);
    const [error, info] = onError.mock.calls[0] as [Error, { componentStack?: string }];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("reported");
    // React 19 supplies a `componentStack` string on the info arg.
    expect(typeof info.componentStack).toBe("string");
    unmount();
  });
});

// ────────────────────────────────────────────────────────────────────────
// Specs — imperative reset
// ────────────────────────────────────────────────────────────────────────

describe("ErrorBoundary — imperative reset", () => {
  it("re-renders the healthy subtree after `reset()` is called from a fallback", () => {
    let capturedReset: (() => void) | undefined;
    let shouldThrow = true;

    const Tree = (): ReactNode =>
      createElement(ErrorBoundary, {
        fallback: ({ reset }: { reset: () => void }) => {
          capturedReset = reset;
          return createElement("span", { "data-testid": "fallback" }, "showing-fallback");
        },
        children: createElement(ThrowIf, { shouldThrow, errorMessage: "first-fail" }),
      });

    const { container, rerender, unmount } = mount(createElement(Tree));

    expect(container.textContent).toBe("showing-fallback");

    // Fix the underlying condition FIRST, then trigger a re-render
    // so the boundary receives a non-throwing `children` prop, then
    // fire the imperative reset. Ordering matters — calling reset()
    // before updating props would just re-throw on the next render
    // and land us right back in the fallback branch.
    shouldThrow = false;
    rerender(createElement(Tree));
    act(() => {
      capturedReset?.();
    });

    expect(container.textContent).toBe("child-rendered");
    unmount();
  });

  it('fires the `onReset({ reason: "imperative" })` callback when reset() is called from the fallback', () => {
    const onReset = vi.fn();
    let capturedReset: (() => void) | undefined;
    const { unmount } = mount(
      createElement(ErrorBoundary, {
        onReset,
        fallback: ({ reset }: { reset: () => void }) => {
          capturedReset = reset;
          return createElement("span", null, "x");
        },
        children: createElement(ThrowIf, { shouldThrow: true }),
      }),
    );
    act(() => {
      capturedReset?.();
    });
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledWith({ reason: "imperative" });
    unmount();
  });
});

// ────────────────────────────────────────────────────────────────────────
// Specs — resetKeys
// ────────────────────────────────────────────────────────────────────────

describe("ErrorBoundary — resetKeys", () => {
  it("resets automatically when any `resetKeys` entry changes while errored", () => {
    // Start errored with keys=[1].
    let shouldThrow = true;
    const Tree = ({ keys }: { keys: readonly unknown[] }): ReactNode =>
      createElement(ErrorBoundary, {
        resetKeys: keys,
        fallback: createElement(StaticFallback),
        children: createElement(ThrowIf, { shouldThrow }),
      });

    const { container, rerender, unmount } = mount(createElement(Tree, { keys: [1] }));
    expect(container.querySelector('[data-testid="fallback"]')).not.toBeNull();

    // Heal the child then bump the reset key.
    shouldThrow = false;
    rerender(createElement(Tree, { keys: [2] }));

    // The boundary saw the new key and reset — the child now renders.
    expect(container.querySelector('[data-testid="child-ok"]')).not.toBeNull();
    unmount();
  });

  it("does NOT reset when the resetKeys entries are `Object.is`-equal", () => {
    // Same primitive value at each index → the identity check
    // returns "unchanged" → no reset.
    let shouldThrow = true;
    const Tree = ({ keys }: { keys: readonly unknown[] }): ReactNode =>
      createElement(ErrorBoundary, {
        resetKeys: keys,
        fallback: createElement(StaticFallback),
        children: createElement(ThrowIf, { shouldThrow }),
      });

    const { container, rerender, unmount } = mount(createElement(Tree, { keys: [1] }));
    shouldThrow = false; // pretend the underlying error is fixed
    rerender(createElement(Tree, { keys: [1] }));

    // Fallback stays because no reset key changed.
    expect(container.querySelector('[data-testid="fallback"]')).not.toBeNull();
    unmount();
  });

  it('fires `onReset({ reason: "keys" })` when the reset was triggered by a key change', () => {
    const onReset = vi.fn();
    let shouldThrow = true;
    const Tree = ({ keys }: { keys: readonly unknown[] }): ReactNode =>
      createElement(ErrorBoundary, {
        onReset,
        resetKeys: keys,
        fallback: createElement(StaticFallback),
        children: createElement(ThrowIf, { shouldThrow }),
      });

    const { rerender, unmount } = mount(createElement(Tree, { keys: [1] }));
    shouldThrow = false;
    rerender(createElement(Tree, { keys: [2] }));

    expect(onReset).toHaveBeenCalledWith({ reason: "keys" });
    unmount();
  });

  it("detects a resetKeys array-length change as a reset trigger", () => {
    let shouldThrow = true;
    const Tree = ({ keys }: { keys: readonly unknown[] }): ReactNode =>
      createElement(ErrorBoundary, {
        resetKeys: keys,
        fallback: createElement(StaticFallback),
        children: createElement(ThrowIf, { shouldThrow }),
      });

    const { container, rerender, unmount } = mount(createElement(Tree, { keys: [1] }));
    shouldThrow = false;
    rerender(createElement(Tree, { keys: [1, 2] }));
    // Length changed → reset fires → healthy child renders.
    expect(container.querySelector('[data-testid="child-ok"]')).not.toBeNull();
    unmount();
  });
});

// ────────────────────────────────────────────────────────────────────────
// Specs — StrictMode interaction
// ────────────────────────────────────────────────────────────────────────

describe("ErrorBoundary — StrictMode", () => {
  it("renders children correctly inside <StrictMode>", () => {
    // Under StrictMode, React double-invokes render for concurrent
    // safety in dev. The boundary must still work — no double-fallback,
    // no duplicated DOM.
    const { container, unmount } = mount(
      createElement(
        StrictMode,
        null,
        createElement(ErrorBoundary, {
          fallback: createElement(StaticFallback),
          children: createElement(ThrowIf, { shouldThrow: false }),
        }),
      ),
    );
    // Single healthy child — no `data-testid="fallback"` in the tree.
    expect(container.querySelector('[data-testid="fallback"]')).toBeNull();
    expect(container.querySelector('[data-testid="child-ok"]')).not.toBeNull();
    unmount();
  });
});
