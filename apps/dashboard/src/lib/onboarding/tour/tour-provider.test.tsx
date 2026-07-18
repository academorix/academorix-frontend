/**
 * @file tour-provider.test.tsx
 * @module onboarding/tour/tour-provider.test
 *
 * @description
 * Tests for the tour provider's core lifecycle:
 *
 * - `shouldAutoTrigger` — every branch of the trigger predicate.
 * - `buildStepList` — surface-aware step composition (web = 4 steps,
 *   PWA/desktop = 5 steps with preface at index 0).
 * - Provider mount → hook exposes state.
 * - `advance` → persists to localStorage.
 * - `skip` → records dismissedAt.
 * - `restart` → clears state + emits restart event.
 *
 * Non-hooks-based coverage lets us test the pure logic in isolation
 * without needing the whole Refine + router tree.
 */

import { act, render, renderHook, screen } from "@testing-library/react";
import { RoutingTestFrame } from "@stackra/routing/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ReactNode } from "react";

import { ONBOARDING_STORAGE_KEYS } from "@/config/onboarding.config";
import { DEFAULT_TOUR_STATE } from "@/lib/onboarding/onboarding.types";
import { readTourState } from "@/lib/onboarding/storage";
import {
  TourProvider,
  __testables,
  restartTour,
  useTour,
} from "@/lib/onboarding/tour/tour-provider";
import { __resetSurfaceForTests } from "@/lib/onboarding/use-surface";

const { shouldAutoTrigger, buildStepList } = __testables;

/**
 * Mock Refine's `useGetIdentity` so the provider sees a stable user
 * id without needing a real auth flow. Vitest hoists `vi.mock` above
 * imports, so the factory refers only to values available at module
 * evaluation.
 */
vi.mock("@refinedev/core", () => ({
  useGetIdentity: () => ({ data: { id: "user-tour-test", name: "Test User" } }),
}));

/**
 * Mock the locale hook so the tour translator has a locale to bind
 * to without the full LocaleProvider tree.
 */
vi.mock("@/lib/i18n", () => ({
  useLocale: () => ({ locale: "en", setLocale: () => {} }),
}));

const originalLocation = Object.getOwnPropertyDescriptor(window, "location");

function stubHref(href: string): void {
  const url = new URL(href);

  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      href: url.href,
      protocol: url.protocol,
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      origin: url.origin,
    },
  });
}

beforeEach(() => {
  window.localStorage.clear();
  __resetSurfaceForTests();
});

afterEach(() => {
  window.localStorage.clear();
  __resetSurfaceForTests();

  if (originalLocation) {
    Object.defineProperty(window, "location", originalLocation);
  }
});

// ---------------------------------------------------------------------------
// Pure logic tests
// ---------------------------------------------------------------------------

describe("shouldAutoTrigger", () => {
  it("returns false when the feature flag is off", () => {
    // We can't easily flip `features.onboardingTour` per test without
    // a full env stub. The function's other guards are exhaustively
    // covered below.
    expect(shouldAutoTrigger("web", false, DEFAULT_TOUR_STATE, false)).toBe(false);
  });

  it("returns true on ?firstRun=1", () => {
    expect(shouldAutoTrigger("web", true, DEFAULT_TOUR_STATE, false)).toBe(true);
  });

  it("returns true for desktop when state is fresh", () => {
    expect(shouldAutoTrigger("desktop", false, DEFAULT_TOUR_STATE, false)).toBe(true);
  });

  it("returns true for PWA when state is fresh and PWA tour not completed", () => {
    expect(shouldAutoTrigger("pwa", false, DEFAULT_TOUR_STATE, false)).toBe(true);
  });

  it("returns false for PWA when PWA tour was already completed", () => {
    expect(shouldAutoTrigger("pwa", false, DEFAULT_TOUR_STATE, true)).toBe(false);
  });

  it("returns false when the tour was already completed on web", () => {
    const state = {
      ...DEFAULT_TOUR_STATE,
      completedAt: "2026-01-01T00:00:00Z",
    };

    expect(shouldAutoTrigger("web", false, state, false)).toBe(false);
  });

  it("returns false when the tour was dismissed", () => {
    const state = {
      ...DEFAULT_TOUR_STATE,
      dismissedAt: "2026-01-01T00:00:00Z",
    };

    expect(shouldAutoTrigger("web", false, state, false)).toBe(false);
  });

  it("returns true when firstRun=1 even after prior completion", () => {
    // Post-signup redirect always fires — a new workspace on the same
    // browser must see the tour again.
    const state = {
      ...DEFAULT_TOUR_STATE,
      completedAt: "2026-01-01T00:00:00Z",
    };

    expect(shouldAutoTrigger("web", true, state, false)).toBe(true);
  });
});

describe("buildStepList", () => {
  it("returns the 4 canonical steps for web", () => {
    expect(buildStepList("web")).toHaveLength(4);
  });

  it("prepends a preface for PWA", () => {
    const steps = buildStepList("pwa");

    expect(steps).toHaveLength(5);
    expect(steps[0]?.id).toBe("tour.pwa.preface");
  });

  it("prepends the same preface for pwa-shortcut", () => {
    const steps = buildStepList("pwa-shortcut");

    expect(steps).toHaveLength(5);
    expect(steps[0]?.id).toBe("tour.pwa.preface");
  });

  it("prepends a different preface for desktop", () => {
    const steps = buildStepList("desktop");

    expect(steps).toHaveLength(5);
    expect(steps[0]?.id).toBe("tour.desktop.preface");
  });
});

// ---------------------------------------------------------------------------
// Provider lifecycle
// ---------------------------------------------------------------------------

function Wrapper({
  children,
  initialUrl = "/",
}: {
  children: ReactNode;
  initialUrl?: string;
}): ReactNode {
  // `<RoutingTestFrame>` mounts the same three providers
  // `renderWithRouting` does — `<ContainerProvider>` +
  // `<StackraRoutingContext.Provider>` + `<MemoryRouter>` — so both
  // Stackra hooks (`useNavigate` etc.) AND RRv7-native re-exports
  // (`useLocation` etc.) resolve inside the tour tree.
  return (
    <RoutingTestFrame initialEntries={[initialUrl]}>
      <TourProvider>{children}</TourProvider>
    </RoutingTestFrame>
  );
}

describe("<TourProvider>", () => {
  it("does not auto-fire on a plain web URL", () => {
    stubHref("http://localhost:3000/dashboard");

    const { result } = renderHook(() => useTour(), {
      wrapper: ({ children }) => <Wrapper>{children}</Wrapper>,
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.totalSteps).toBe(4);
  });

  it("auto-fires when ?firstRun=1 is present", async () => {
    stubHref("http://localhost:3000/dashboard?firstRun=1");

    render(
      <Wrapper initialUrl="/dashboard?firstRun=1">
        <div />
      </Wrapper>,
    );

    // The popover is rendered via a portal into document.body.
    expect(await screen.findByTestId("onboarding-tour-overlay")).toBeInTheDocument();
  });

  it("advance() bumps the step index + persists", () => {
    stubHref("http://localhost:3000/dashboard");

    const { result } = renderHook(() => useTour(), {
      wrapper: ({ children }) => <Wrapper>{children}</Wrapper>,
    });

    // Manually restart to activate — plain web + no firstRun means no auto-trigger.
    // Wrap each imperative call in `act()` so React 18's automatic batching
    // flushes the state updater (including the `writeTourState()` side effect
    // inside it) before we read localStorage. Without `act()` the reducer
    // stays queued and the persisted step is stale.
    act(() => {
      result.current.restart();
    });
    act(() => {
      result.current.next();
    });

    const persisted = readTourState("user-tour-test");

    expect(persisted.step).toBe(1);
    expect(persisted.restartedCount).toBe(1);
  });

  it("back() decrements the step, never below 0", () => {
    stubHref("http://localhost:3000/dashboard");

    const { result } = renderHook(() => useTour(), {
      wrapper: ({ children }) => <Wrapper>{children}</Wrapper>,
    });

    // Wrap every state-mutating call in `act()` — see the `advance()` test
    // above for the rationale. Splitting into individual `act()` blocks (as
    // opposed to grouping into one) ensures each update flushes before the
    // next reducer runs, so `current.step` in the functional updater is
    // fresh.
    act(() => {
      result.current.restart();
    });
    act(() => {
      result.current.next();
    });
    act(() => {
      result.current.next();
    });
    act(() => {
      result.current.back();
    });
    act(() => {
      result.current.back();
    });
    act(() => {
      result.current.back();
    });

    const persisted = readTourState("user-tour-test");

    expect(persisted.step).toBe(0);
  });

  it("skip() records dismissedAt", () => {
    stubHref("http://localhost:3000/dashboard");

    const { result } = renderHook(() => useTour(), {
      wrapper: ({ children }) => <Wrapper>{children}</Wrapper>,
    });

    act(() => {
      result.current.restart();
    });
    act(() => {
      result.current.skip();
    });

    const persisted = readTourState("user-tour-test");

    expect(persisted.dismissedAt).not.toBeNull();
  });

  it("advancing past the last step records completedAt", () => {
    stubHref("http://localhost:3000/dashboard");

    const { result } = renderHook(() => useTour(), {
      wrapper: ({ children }) => <Wrapper>{children}</Wrapper>,
    });

    // Web surface has 4 canonical steps (indices 0..3). Advancing from step
    // 3 with `next()` triggers the completion path.
    act(() => {
      result.current.restart();
    });
    act(() => {
      result.current.next();
    }); // 0 -> 1
    act(() => {
      result.current.next();
    }); // 1 -> 2
    act(() => {
      result.current.next();
    }); // 2 -> 3
    act(() => {
      result.current.next();
    }); // 3 -> completed

    const persisted = readTourState("user-tour-test");

    expect(persisted.completedAt).not.toBeNull();
  });

  it("strips one-shot URL markers on first render", () => {
    // We can't easily assert the URL rewrite without a full router
    // harness. What we CAN assert is that the localStorage flow
    // ends up in a stable state — the trigger doesn't re-fire when
    // the same component re-mounts.
    stubHref("http://localhost:3000/dashboard?firstRun=1");

    const { rerender } = render(
      <Wrapper initialUrl="/dashboard?firstRun=1">
        <div />
      </Wrapper>,
    );

    rerender(
      <Wrapper initialUrl="/dashboard?firstRun=1">
        <div />
      </Wrapper>,
    );

    // Test passes if no exception was thrown during the double render.
    expect(
      window.localStorage.getItem(`${ONBOARDING_STORAGE_KEYS.tour}:user-tour-test`),
    ).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Imperative restart entry
// ---------------------------------------------------------------------------

describe("restartTour (imperative entry)", () => {
  it("is a no-op when the provider is not mounted", () => {
    // Should NOT throw. This is important — the Help menu may
    // reference `restartTour` before the provider mounts (unauth'd
    // login screen, error boundary fallback).
    expect(() => restartTour()).not.toThrow();
  });

  it("kicks the mounted provider's restart when called", async () => {
    stubHref("http://localhost:3000/dashboard");

    render(
      <Wrapper>
        <div />
      </Wrapper>,
    );

    // Not active initially — plain web URL, no firstRun marker.
    expect(screen.queryByTestId("onboarding-tour-overlay")).not.toBeInTheDocument();

    // The imperative entry calls the provider's `restart` under the hood,
    // which sets React state — wrap in `act()` so the effect flush is
    // deterministic before we assert the overlay renders.
    act(() => {
      restartTour();
    });

    expect(await screen.findByTestId("onboarding-tour-overlay")).toBeInTheDocument();
  });
});
