/**
 * @file create-analytics-context.test.tsx
 * @module @academorix/analytics/context/__tests__/create-analytics-context.test
 *
 * @description
 * Covers the {@link createAnalyticsContext} factory: guard when used
 * outside a provider, fan-out to every adapter, isolation of a
 * throwing adapter (error is logged, remaining adapters still fire),
 * empty-adapter-list no-op behaviour, and reactive fan-out when the
 * provider re-mounts with a new adapters list.
 */

import { fireEvent, render, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAnalyticsContext } from "../create-analytics-context";

import type {
  AnalyticsAdapter,
  AnalyticsIdentity,
  AnalyticsPageView,
  AnalyticsProperties,
} from "../../adapters/analytics-adapter.type";
import type { PropsWithChildren } from "react";

/**
 * Builds a lightweight adapter with `vi.fn()` methods so tests can
 * inspect what got called and with what arguments.
 */
function makeAdapter(name: string): AnalyticsAdapter & {
  track: ReturnType<typeof vi.fn>;
  identify: ReturnType<typeof vi.fn>;
  page: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
} {
  return {
    name,
    track: vi.fn<(name: string, properties?: AnalyticsProperties) => void>(),
    identify: vi.fn<(identity: AnalyticsIdentity) => void>(),
    page: vi.fn<(view: AnalyticsPageView) => void>(),
    reset: vi.fn<() => void>(),
  };
}

/** Typed event union — mirrors what an app would derive from `defineEvents`. */
type StubEvent = "user_logged_in" | "athlete_created";

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // The provider logs adapter throws to console.error — silence it
  // during tests but keep the spy so we can assert it was called.
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAnalytics — guard rail", () => {
  it("throws when called outside an AnalyticsProvider", () => {
    const { useAnalytics } = createAnalyticsContext<StubEvent>();

    // React's error boundary machinery logs to console.error; silence
    // the trace so the test output stays clean.
    const reactErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useAnalytics())).toThrow(
      /useAnalytics must be used within an <AnalyticsProvider>/,
    );

    reactErrorSpy.mockRestore();
  });
});

describe("AnalyticsProvider — fan-out", () => {
  it("dispatches `track` to every adapter with the same arguments", () => {
    const a = makeAdapter("adapter-a");
    const b = makeAdapter("adapter-b");
    const c = makeAdapter("adapter-c");

    const { AnalyticsProvider, useAnalytics } = createAnalyticsContext<StubEvent>();
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <AnalyticsProvider adapters={[a, b, c]}>{children}</AnalyticsProvider>
    );

    const { result } = renderHook(() => useAnalytics(), { wrapper });

    result.current.track("athlete_created", { tenantId: "t-1" });

    expect(a.track).toHaveBeenCalledWith("athlete_created", { tenantId: "t-1" });
    expect(b.track).toHaveBeenCalledWith("athlete_created", { tenantId: "t-1" });
    expect(c.track).toHaveBeenCalledWith("athlete_created", { tenantId: "t-1" });
  });

  it("dispatches `identify` to every adapter", () => {
    const a = makeAdapter("adapter-a");
    const b = makeAdapter("adapter-b");
    const identity: AnalyticsIdentity = { id: "u-1", email: "sam@example.com" };

    const { AnalyticsProvider, useAnalytics } = createAnalyticsContext<StubEvent>();
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <AnalyticsProvider adapters={[a, b]}>{children}</AnalyticsProvider>
    );

    const { result } = renderHook(() => useAnalytics(), { wrapper });

    result.current.identify(identity);

    expect(a.identify).toHaveBeenCalledWith(identity);
    expect(b.identify).toHaveBeenCalledWith(identity);
  });

  it("dispatches `page` to every adapter", () => {
    const a = makeAdapter("adapter-a");
    const b = makeAdapter("adapter-b");
    const view: AnalyticsPageView = { path: "/dashboard", title: "Home" };

    const { AnalyticsProvider, useAnalytics } = createAnalyticsContext<StubEvent>();
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <AnalyticsProvider adapters={[a, b]}>{children}</AnalyticsProvider>
    );

    const { result } = renderHook(() => useAnalytics(), { wrapper });

    result.current.page(view);

    expect(a.page).toHaveBeenCalledWith(view);
    expect(b.page).toHaveBeenCalledWith(view);
  });

  it("dispatches `reset` to every adapter that exposes one", () => {
    const withReset = makeAdapter("with-reset");
    // An adapter that omits `reset` entirely — the provider must
    // still call the remaining adapters without erroring on the
    // optional method.
    const withoutReset: AnalyticsAdapter = {
      name: "no-reset",
      track: vi.fn(),
      identify: vi.fn(),
      page: vi.fn(),
    };

    const { AnalyticsProvider, useAnalytics } = createAnalyticsContext<StubEvent>();
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <AnalyticsProvider adapters={[withReset, withoutReset]}>{children}</AnalyticsProvider>
    );

    const { result } = renderHook(() => useAnalytics(), { wrapper });

    expect(() => result.current.reset()).not.toThrow();
    expect(withReset.reset).toHaveBeenCalledTimes(1);
  });
});

describe("AnalyticsProvider — resilience", () => {
  it("catches a throwing adapter, logs to console.error, and continues fan-out", () => {
    const bad = makeAdapter("bad");
    const good = makeAdapter("good");

    bad.track.mockImplementation(() => {
      throw new Error("bad adapter exploded");
    });

    const { AnalyticsProvider, useAnalytics } = createAnalyticsContext<StubEvent>();
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <AnalyticsProvider adapters={[bad, good]}>{children}</AnalyticsProvider>
    );

    const { result } = renderHook(() => useAnalytics(), { wrapper });

    expect(() => result.current.track("user_logged_in")).not.toThrow();

    expect(bad.track).toHaveBeenCalled();
    // The good adapter still fires despite the bad one blowing up.
    expect(good.track).toHaveBeenCalledWith("user_logged_in", undefined);
    // And the failure was surfaced via console.error rather than
    // silently swallowed.
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe("AnalyticsProvider — empty adapter list", () => {
  it("no-ops silently across every dispatcher", () => {
    const { AnalyticsProvider, useAnalytics } = createAnalyticsContext<StubEvent>();
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <AnalyticsProvider adapters={[]}>{children}</AnalyticsProvider>
    );

    const { result } = renderHook(() => useAnalytics(), { wrapper });

    expect(() => {
      result.current.track("user_logged_in");
      result.current.identify({ id: "u-1" });
      result.current.page({ path: "/" });
      result.current.reset();
    }).not.toThrow();

    // No adapter → no console noise (aside from the beforeEach spy
    // which stays clean because the provider had nothing to catch).
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

describe("AnalyticsProvider — dynamic adapters list", () => {
  it("calls the newly-added adapter after the parent re-renders with a new list", () => {
    const first = makeAdapter("first");
    const second = makeAdapter("second");

    const { AnalyticsProvider, useAnalytics } = createAnalyticsContext<StubEvent>();

    // Placing the "fire" button inside the reader means each render
    // captures a fresh `track` from `useAnalytics()`, which reflects
    // the latest adapters list. That's the whole point of the test:
    // after the parent swaps the list, the next click must fan out
    // to the new adapters.
    function ReaderWithFireButton(): React.ReactElement {
      const { track } = useAnalytics();

      return (
        <button type="button" onClick={(): void => track("user_logged_in")}>
          fire
        </button>
      );
    }

    function App(): React.ReactElement {
      const [adapters, setAdapters] = useState<AnalyticsAdapter[]>([first]);

      return (
        <AnalyticsProvider adapters={adapters}>
          <button type="button" onClick={(): void => setAdapters([first, second])}>
            add-second
          </button>
          <ReaderWithFireButton />
        </AnalyticsProvider>
      );
    }

    const { getByText } = render(<App />);

    // Only the first adapter should fire before we grow the list.
    fireEvent.click(getByText("fire"));
    expect(first.track).toHaveBeenCalledTimes(1);
    expect(second.track).not.toHaveBeenCalled();

    // Grow the list and fire again. Both adapters should now receive.
    fireEvent.click(getByText("add-second"));
    fireEvent.click(getByText("fire"));
    expect(first.track).toHaveBeenCalledTimes(2);
    expect(second.track).toHaveBeenCalledTimes(1);
  });
});
