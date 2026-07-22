// @vitest-environment jsdom
/**
 * @file fallbacks.spec.ts
 * @module @stackra/error/__tests__/unit
 * @description Behavioural spec for the shipped fallback components —
 *   `DefaultErrorFallback`, `InlineErrorFallback`, and the higher-
 *   level presets (`AppErrorBoundary`, `ComponentErrorBoundary`) that
 *   compose them onto the base `ErrorBoundary`.
 *
 *   Rendering these requires jsdom + the `window.matchMedia` polyfill
 *   installed in `__tests__/vitest.setup.ts` (HeroUI Pro's Sheet
 *   component reads matchMedia at module load).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, createElement, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import { AppErrorBoundary } from "@/react/components/app-error-boundary/app-error-boundary.component";
import { ComponentErrorBoundary } from "@/react/components/component-error-boundary/component-error-boundary.component";
import { DefaultErrorFallback } from "@/react/components/fallbacks/default-error-fallback";
import { InlineErrorFallback } from "@/react/components/fallbacks/inline-error-fallback";

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

interface BoomProps {
  message?: string;
}
function Boom({ message = "boom" }: BoomProps): ReactNode {
  throw new Error(message);
}

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // React logs caught boundary errors via console.error — silence
  // the noise but keep the spy handy for inspection.
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

// ────────────────────────────────────────────────────────────────────────
// DefaultErrorFallback (visual — sanity only)
// ────────────────────────────────────────────────────────────────────────

describe("DefaultErrorFallback", () => {
  it('renders a role="alert" wrapper carrying the error message', () => {
    const { container, unmount } = mount(
      createElement(DefaultErrorFallback, { error: new Error("unavailable") }),
    );
    const alertRoot = container.querySelector('[role="alert"]');
    expect(alertRoot).not.toBeNull();
    expect(container.textContent).toContain("unavailable");
    unmount();
  });

  it('shows the "Try again" button only when a `reset` prop is supplied', () => {
    const withoutReset = mount(createElement(DefaultErrorFallback, { error: new Error("x") }));
    // Look for the button by its visible label — HeroUI renders it
    // as a real `<button>`.
    expect(withoutReset.container.textContent).not.toContain("Try again");
    withoutReset.unmount();

    const reset = vi.fn();
    const withReset = mount(createElement(DefaultErrorFallback, { error: new Error("x"), reset }));
    expect(withReset.container.textContent).toContain("Try again");
    withReset.unmount();
  });

  it("renders the stack trace panel when `showDetails` is true", () => {
    const err = new Error("trace");
    // Ensure the stack contains something detectable.
    err.stack = "Error: trace\n    at somewhere.ts:1:1";
    const { container, unmount } = mount(
      createElement(DefaultErrorFallback, { error: err, showDetails: true }),
    );
    expect(container.textContent).toContain("somewhere.ts");
    unmount();
  });
});

// ────────────────────────────────────────────────────────────────────────
// InlineErrorFallback
// ────────────────────────────────────────────────────────────────────────

describe("InlineErrorFallback", () => {
  it("renders as an alert with the default label and error message", () => {
    const { container, unmount } = mount(
      createElement(InlineErrorFallback, { error: new Error("widget-broke") }),
    );
    // The default label is "This section failed to load."
    expect(container.textContent).toContain("This section failed to load.");
    expect(container.textContent).toContain("widget-broke");
    unmount();
  });

  it("honours a custom `label` prop", () => {
    const { container, unmount } = mount(
      createElement(InlineErrorFallback, {
        error: new Error("x"),
        label: "Activity feed unavailable.",
      }),
    );
    expect(container.textContent).toContain("Activity feed unavailable.");
    unmount();
  });
});

// ────────────────────────────────────────────────────────────────────────
// AppErrorBoundary (preset)
// ────────────────────────────────────────────────────────────────────────

describe("AppErrorBoundary", () => {
  it("renders children when they do not throw", () => {
    const { container, unmount } = mount(
      createElement(AppErrorBoundary, {
        children: createElement("div", { "data-testid": "app-content" }, "hello"),
      }),
    );
    expect(container.querySelector('[data-testid="app-content"]')?.textContent).toBe("hello");
    unmount();
  });

  it("catches child errors and renders the DefaultErrorFallback", () => {
    const { container, unmount } = mount(
      createElement(AppErrorBoundary, {
        title: "App down",
        children: createElement(Boom, { message: "the-cause" }),
      }),
    );
    // The preset routes the error through DefaultErrorFallback, so
    // both the title AND the error message land in the DOM.
    expect(container.textContent).toContain("App down");
    expect(container.textContent).toContain("the-cause");
    unmount();
  });
});

// ────────────────────────────────────────────────────────────────────────
// ComponentErrorBoundary (preset)
// ────────────────────────────────────────────────────────────────────────

describe("ComponentErrorBoundary", () => {
  it("renders children when they do not throw", () => {
    const { container, unmount } = mount(
      createElement(ComponentErrorBoundary, {
        children: createElement("div", { "data-testid": "widget" }, "widget-ok"),
      }),
    );
    expect(container.querySelector('[data-testid="widget"]')?.textContent).toBe("widget-ok");
    unmount();
  });

  it("catches child errors and renders the InlineErrorFallback with the supplied label", () => {
    const { container, unmount } = mount(
      createElement(ComponentErrorBoundary, {
        label: "Widget offline.",
        children: createElement(Boom, { message: "inner-cause" }),
      }),
    );
    expect(container.textContent).toContain("Widget offline.");
    expect(container.textContent).toContain("inner-cause");
    unmount();
  });
});
