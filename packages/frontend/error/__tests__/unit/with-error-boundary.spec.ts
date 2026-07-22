// @vitest-environment jsdom
/**
 * @file with-error-boundary.spec.ts
 * @module @stackra/error/__tests__/unit
 * @description Behavioural spec for `withErrorBoundary(...)` — the
 *   higher-order component that wraps a target component in an
 *   `ErrorBoundary` with preset options.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { withErrorBoundary } from "@/react/components/with-error-boundary/with-error-boundary.component";

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

describe("withErrorBoundary", () => {
  it("forwards props to the wrapped component when it does not throw", () => {
    function Greeting({ name }: { name: string }): ReactNode {
      return createElement("span", { "data-testid": "greeting" }, `Hello, ${name}`);
    }
    const SafeGreeting = withErrorBoundary(Greeting);
    const { container, unmount } = mount(createElement(SafeGreeting, { name: "Kiro" }));
    expect(container.querySelector('[data-testid="greeting"]')?.textContent).toBe("Hello, Kiro");
    unmount();
  });

  it("applies the preset boundary options (fallback + onError) to catch child errors", () => {
    const onError = vi.fn();
    function BoomComponent(): ReactNode {
      throw new Error("hoc-boom");
    }
    const Safe = withErrorBoundary(BoomComponent, {
      onError,
      fallback: createElement("span", { "data-testid": "hoc-fallback" }, "caught-by-hoc"),
    });
    const { container, unmount } = mount(createElement(Safe));
    expect(container.querySelector('[data-testid="hoc-fallback"]')).not.toBeNull();
    expect(onError).toHaveBeenCalledTimes(1);
    // The originally-thrown error reached the shared onError callback.
    expect((onError.mock.calls[0][0] as Error).message).toBe("hoc-boom");
    unmount();
  });

  it("sets a descriptive `displayName` on the returned component", () => {
    function InnerName(): ReactNode {
      return null;
    }
    const Wrapped = withErrorBoundary(InnerName);
    // The HOC preserves the inner name so DevTools shows
    // `withErrorBoundary(InnerName)` on the tree.
    expect(Wrapped.displayName).toBe("withErrorBoundary(InnerName)");
  });

  it('falls back to "Component" for a nameless target (undefined `.name`)', () => {
    const Anon: unknown = Object.create(Function.prototype);
    Object.defineProperty(Anon, "displayName", { value: undefined });
    Object.defineProperty(Anon, "name", { value: undefined });
    const Wrapped = withErrorBoundary(Anon as (props: object) => ReactNode);
    expect(Wrapped.displayName).toBe("withErrorBoundary(Component)");
  });

  it('falls back to "Component" for a target whose `.name` is an empty string', () => {
    // The HOC uses `||` (not `??`), so an EMPTY-string `.name`
    // (anonymous arrow functions stored on a symbol, HOCs with a
    // blank displayName) also falls through to "Component". Without
    // this fallback, DevTools shows `withErrorBoundary()`.
    const Anon: unknown = Object.create(Function.prototype);
    Object.defineProperty(Anon, "displayName", { value: "" });
    Object.defineProperty(Anon, "name", { value: "" });
    const Wrapped = withErrorBoundary(Anon as (props: object) => ReactNode);
    expect(Wrapped.displayName).toBe("withErrorBoundary(Component)");
  });
});
