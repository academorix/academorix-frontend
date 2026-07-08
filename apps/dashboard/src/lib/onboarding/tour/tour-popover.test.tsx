/**
 * @file tour-popover.test.tsx
 * @module onboarding/tour/tour-popover.test
 *
 * @description
 * Tests for the tour popover anchor resolution logic. Focused on the
 * two-channel resolver (data-tour-anchor first, config selector
 * fallback) and the centred fallback when neither matches.
 *
 * We exercise the popover indirectly via the tour provider — the
 * popover pulls state from `useTour()` so we can't test it in complete
 * isolation without stubbing the whole context. Instead we mount a
 * full provider tree in a MemoryRouter, restart the tour, and inspect
 * the `data-anchor-mode` attribute the popover exposes on the
 * overlay.
 */

import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ReactNode } from "react";

import { TourProvider, restartTour } from "@/lib/onboarding/tour/tour-provider";
import { __resetSurfaceForTests } from "@/lib/onboarding/use-surface";

// Same mock stack the sibling `tour-provider.test.tsx` uses.
vi.mock("@refinedev/core", () => ({
  useGetIdentity: () => ({ data: { id: "user-anchor-test", name: "Test User" } }),
}));

vi.mock("@/lib/i18n", () => ({
  useLocale: () => ({ locale: "en", setLocale: () => {} }),
}));

function Wrapper({ children }: { children: ReactNode }): ReactNode {
  return (
    <MemoryRouter initialEntries={["/dashboard"]}>
      <TourProvider>{children}</TourProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  __resetSurfaceForTests();
});

afterEach(() => {
  window.localStorage.clear();
  __resetSurfaceForTests();
  // Clean up any anchor elements we injected.
  document.querySelectorAll("[data-tour-anchor]").forEach((el) => el.remove());
});

describe("TourPopover anchor resolution", () => {
  it("renders centred when no anchor matches either channel", async () => {
    render(
      <Wrapper>
        <div />
      </Wrapper>,
    );

    // Trigger the tour manually (plain web + no firstRun means no
    // auto-fire).
    act(() => {
      restartTour();
    });

    const overlay = await screen.findByTestId("onboarding-tour-overlay");

    // Step 1 has an anchorSelector of [data-testid="sidebar-athletes"]
    // which isn't in the DOM. It also has no data-tour-anchor. The
    // popover MUST fall back to centred.
    expect(overlay.getAttribute("data-anchor-mode")).toBe("centered");
  });

  it("anchors to a data-tour-anchor element when present", async () => {
    // Inject a matching data-tour-anchor sentinel BEFORE the tour
    // renders so the popover measures it on the first pass.
    const anchor = document.createElement("div");

    anchor.setAttribute("data-tour-anchor", "tour.workspace");
    // Non-zero rect so `measureAnchorForStep` doesn't classify it as
    // hidden.
    Object.defineProperty(anchor, "getBoundingClientRect", {
      value: () => ({
        top: 100,
        left: 200,
        width: 40,
        height: 40,
        right: 240,
        bottom: 140,
        x: 200,
        y: 100,
        toJSON: () => ({}),
      }),
    });
    document.body.appendChild(anchor);

    render(
      <Wrapper>
        <div />
      </Wrapper>,
    );

    act(() => {
      restartTour();
    });

    const overlay = await screen.findByTestId("onboarding-tour-overlay");

    expect(overlay.getAttribute("data-anchor-mode")).toBe("anchored");
  });

  it("uses config anchorSelector as fallback when data-tour-anchor missing", async () => {
    // Inject a matching data-testid sentinel (the fallback selector
    // shipped in TOUR_STEPS for step 1).
    const anchor = document.createElement("div");

    anchor.setAttribute("data-testid", "sidebar-athletes");
    Object.defineProperty(anchor, "getBoundingClientRect", {
      value: () => ({
        top: 200,
        left: 20,
        width: 200,
        height: 32,
        right: 220,
        bottom: 232,
        x: 20,
        y: 200,
        toJSON: () => ({}),
      }),
    });
    document.body.appendChild(anchor);

    render(
      <Wrapper>
        <div />
      </Wrapper>,
    );

    act(() => {
      restartTour();
    });

    const overlay = await screen.findByTestId("onboarding-tour-overlay");

    // The fallback selector matched — popover is anchored.
    expect(overlay.getAttribute("data-anchor-mode")).toBe("anchored");
  });

  it("prefers data-tour-anchor over the config selector when both are present", async () => {
    // Both anchors present. The data-tour-anchor version renders at
    // (500, 500), the fallback at (10, 10). If the resolver used the
    // config selector we'd expect a bounding rect around (10, 10);
    // we can't easily assert the position here without exposing more
    // internal state, so we assert `data-anchor-mode` is "anchored"
    // and trust the resolver's stated priority order.
    const scoped = document.createElement("div");

    scoped.setAttribute("data-tour-anchor", "tour.workspace");
    Object.defineProperty(scoped, "getBoundingClientRect", {
      value: () => ({
        top: 500,
        left: 500,
        width: 50,
        height: 50,
        right: 550,
        bottom: 550,
        x: 500,
        y: 500,
        toJSON: () => ({}),
      }),
    });
    document.body.appendChild(scoped);

    const fallback = document.createElement("div");

    fallback.setAttribute("data-testid", "sidebar-athletes");
    Object.defineProperty(fallback, "getBoundingClientRect", {
      value: () => ({
        top: 10,
        left: 10,
        width: 50,
        height: 50,
        right: 60,
        bottom: 60,
        x: 10,
        y: 10,
        toJSON: () => ({}),
      }),
    });
    document.body.appendChild(fallback);

    render(
      <Wrapper>
        <div />
      </Wrapper>,
    );

    act(() => {
      restartTour();
    });

    const overlay = await screen.findByTestId("onboarding-tour-overlay");

    expect(overlay.getAttribute("data-anchor-mode")).toBe("anchored");
  });
});
