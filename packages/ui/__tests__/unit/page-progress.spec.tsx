// @vitest-environment jsdom
/**
 * @file page-progress.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for `<PageProgressProvider>` — covers
 *   the initial "idle" state, `start()` mounting the bar and pushing
 *   progress to the minimum, `done()` unmounting the bar after the
 *   completion transition, `increment()` advancing progress, and the
 *   context wiring via `usePageProgress()`.
 */

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";

import { PageProgressProvider } from "@/react/providers/page-progress/page-progress.provider";
import { usePageProgress } from "@/react/hooks/use-page-progress/use-page-progress.hook";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

/**
 * Small in-tree probe component that surfaces the context state and
 * exposes buttons to invoke `start` / `done` / `increment`.
 */
function Probe(): React.ReactElement {
  const ctx = usePageProgress();

  return (
    <div>
      <span data-testid="progress">{ctx.progress}</span>
      <span data-testid="animating">{String(ctx.isAnimating)}</span>
      <button data-testid="start" type="button" onClick={ctx.start}>
        start
      </button>
      <button data-testid="done" type="button" onClick={ctx.done}>
        done
      </button>
      <button data-testid="increment" type="button" onClick={ctx.increment}>
        increment
      </button>
    </div>
  );
}

describe("<PageProgressProvider>", () => {
  it("renders its children", () => {
    render(
      <PageProgressProvider>
        <span data-testid="child">child</span>
      </PageProgressProvider>,
    );
    expect(screen.getByTestId("child")).toBeDefined();
  });

  it("initial context has progress=0 and isAnimating=false", () => {
    render(
      <PageProgressProvider>
        <Probe />
      </PageProgressProvider>,
    );
    expect(screen.getByTestId("progress").textContent).toBe("0");
    expect(screen.getByTestId("animating").textContent).toBe("false");
  });

  it("does NOT mount the progress bar before start()", () => {
    render(
      <PageProgressProvider>
        <Probe />
      </PageProgressProvider>,
    );
    expect(document.querySelector('[data-component="page-progress"]')).toBeNull();
  });

  it("start() mounts the bar and flips isAnimating=true", () => {
    render(
      <PageProgressProvider minimum={10}>
        <Probe />
      </PageProgressProvider>,
    );

    act(() => {
      screen.getByTestId("start").click();
    });

    expect(document.querySelector('[data-component="page-progress"]')).not.toBeNull();
    expect(screen.getByTestId("animating").textContent).toBe("true");
    // Progress starts at the configured minimum.
    expect(Number(screen.getByTestId("progress").textContent)).toBe(10);
  });

  it("increment() advances progress by a positive delta after start()", () => {
    render(
      <PageProgressProvider minimum={10}>
        <Probe />
      </PageProgressProvider>,
    );
    act(() => {
      screen.getByTestId("start").click();
    });
    const before = Number(screen.getByTestId("progress").textContent);

    act(() => {
      screen.getByTestId("increment").click();
    });
    const after = Number(screen.getByTestId("progress").textContent);

    // Trickle-based increments are randomized but ALWAYS positive when
    // progress < 95, so the value must have moved forward.
    expect(after).toBeGreaterThan(before);
  });

  it("done() flips isAnimating=false and unmounts the bar after the fade timeout", () => {
    render(
      <PageProgressProvider minimum={10}>
        <Probe />
      </PageProgressProvider>,
    );

    act(() => {
      screen.getByTestId("start").click();
    });
    expect(document.querySelector('[data-component="page-progress"]')).not.toBeNull();

    act(() => {
      screen.getByTestId("done").click();
    });
    expect(screen.getByTestId("animating").textContent).toBe("false");
    // The bar stays visible for the 300ms fade transition, then unmounts.
    expect(document.querySelector('[data-component="page-progress"]')).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(document.querySelector('[data-component="page-progress"]')).toBeNull();
    expect(screen.getByTestId("progress").textContent).toBe("0");
  });

  it("applies the `zIndex` prop to the bar wrapper", () => {
    render(
      <PageProgressProvider zIndex={12345}>
        <Probe />
      </PageProgressProvider>,
    );
    act(() => {
      screen.getByTestId("start").click();
    });
    const bar = document.querySelector('[data-component="page-progress"]') as HTMLElement;
    expect(bar.style.zIndex).toBe("12345");
  });

  it("trickle interval advances progress over time", () => {
    render(
      <PageProgressProvider minimum={10} trickleSpeed={100}>
        <Probe />
      </PageProgressProvider>,
    );
    act(() => {
      screen.getByTestId("start").click();
    });
    const initial = Number(screen.getByTestId("progress").textContent);

    // Advance three trickle ticks — every tick adds a positive delta.
    act(() => {
      vi.advanceTimersByTime(300);
    });
    const later = Number(screen.getByTestId("progress").textContent);

    expect(later).toBeGreaterThan(initial);
    // The trickle capping keeps values under 99.4 forever.
    expect(later).toBeLessThan(99.5);
  });
});
