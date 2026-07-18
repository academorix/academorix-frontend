/**
 * @file subscription-banner.test.tsx
 * @module components/billing/subscription-banner.test
 *
 * @description
 * Component tests for {@link SubscriptionBanner}. We mock `useSubscription`
 * (the sole data dependency) at the module boundary so we can drive the
 * banner into each lifecycle state, and wrap the render in
 * `renderWithRouting()` from `@stackra/routing/testing` because the
 * banner uses `useNavigate` from `@stackra/routing/react` for its CTA.
 *
 * Real `bannerFor()` runs — we exercise the full state machine, not a mock
 * of it, so a copy/tone change surfaces here immediately.
 *
 * Covers:
 *   1. Silent for active subscriptions.
 *   2. Info banner for the onboarding state (subscription: null).
 *   3. Non-dismissable danger banner for past_due / grace / suspended.
 *   4. Dismissable info banner for trialing, hides after dismiss click.
 *   5. sessionStorage-backed dismissal survives the render.
 */

import { fireEvent, screen } from "@testing-library/react";
import { renderWithRouting } from "@stackra/routing/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SubscriptionStatus, SubscriptionSummary } from "@/types";
import type { ReactElement } from "react";

const useSubscriptionMock = vi.fn();

vi.mock("@/lib/billing", async () => {
  const actual = await vi.importActual<typeof import("@/lib/billing")>("@/lib/billing");

  return {
    ...actual,
    useSubscription: () => useSubscriptionMock(),
  };
});

import { SubscriptionBanner } from "@/components/billing/subscription-banner";

/**
 * Builds a subscription with sane defaults; tests override just the fields
 * they exercise.
 */
function makeSubscription(overrides: Partial<SubscriptionSummary> = {}): SubscriptionSummary {
  return {
    id: 1,
    plan_key: "growth",
    plan_id: 3,
    plan_version: 1,
    status: "active",
    entitlements_active: true,
    billing_period: "monthly",
    currency: "USD",
    trial_ends_at: null,
    current_period_ends_at: "2026-08-02T00:00:00+00:00",
    grace_ends_at: null,
    canceled_at: null,
    ...overrides,
  };
}

/**
 * Renders `children` inside the Stackra routing test context so the
 * banner's `useNavigate()` (from `@stackra/routing/react`) resolves.
 */
function renderWithRouter(ui: ReactElement) {
  return renderWithRouting(ui);
}

beforeEach(() => {
  useSubscriptionMock.mockReset();
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.sessionStorage.clear();
});

describe("SubscriptionBanner", () => {
  it("renders nothing for an active subscription", () => {
    useSubscriptionMock.mockReturnValue(makeSubscription({ status: "active" }));

    const { container } = renderWithRouter(<SubscriptionBanner />);

    expect(container.firstChild).toBeNull();
  });

  it("renders the onboarding banner when there is no subscription", () => {
    useSubscriptionMock.mockReturnValue(null);

    renderWithRouter(<SubscriptionBanner />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/choose a plan/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /see plans/i })).toBeInTheDocument();
  });

  it("renders a non-dismissable danger banner when past_due", () => {
    useSubscriptionMock.mockReturnValue(makeSubscription({ status: "past_due" }));

    renderWithRouter(<SubscriptionBanner />);

    expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^dismiss$/i })).not.toBeInTheDocument();
  });

  it("renders a non-dismissable danger banner when suspended", () => {
    useSubscriptionMock.mockReturnValue(makeSubscription({ status: "suspended" }));

    renderWithRouter(<SubscriptionBanner />);

    expect(screen.getByText(/subscription suspended/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^dismiss$/i })).not.toBeInTheDocument();
  });

  it("renders a warning banner when paused", () => {
    useSubscriptionMock.mockReturnValue(makeSubscription({ status: "paused" }));

    renderWithRouter(<SubscriptionBanner />);

    expect(screen.getByText(/subscription paused/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resume/i })).toBeInTheDocument();
  });

  it("renders a dismissable info banner during trial and hides it after dismiss", () => {
    // 5 days from now so we get a stable "5 days" title.
    const trial_ends_at = new Date(Date.now() + 5 * 86_400_000).toISOString();

    useSubscriptionMock.mockReturnValue(makeSubscription({ status: "trialing", trial_ends_at }));

    renderWithRouter(<SubscriptionBanner />);

    const dismiss = screen.getByRole("button", { name: /^dismiss$/i });

    expect(screen.getByText(/trial ends in/i)).toBeInTheDocument();

    fireEvent.click(dismiss);

    expect(screen.queryByText(/trial ends in/i)).not.toBeInTheDocument();
  });

  it("persists the dismissal to sessionStorage", () => {
    const trial_ends_at = new Date(Date.now() + 5 * 86_400_000).toISOString();

    useSubscriptionMock.mockReturnValue(makeSubscription({ status: "trialing", trial_ends_at }));

    renderWithRouter(<SubscriptionBanner />);

    fireEvent.click(screen.getByRole("button", { name: /^dismiss$/i }));

    expect(window.sessionStorage.getItem("academorix.billing.banner.dismissed")).toBe("1");
  });

  it("does not render a dismissed banner on a fresh mount with the same status", () => {
    // Simulate a prior dismissal.
    window.sessionStorage.setItem("academorix.billing.banner.dismissed", "1");

    const trial_ends_at = new Date(Date.now() + 5 * 86_400_000).toISOString();

    useSubscriptionMock.mockReturnValue(makeSubscription({ status: "trialing", trial_ends_at }));

    renderWithRouter(<SubscriptionBanner />);

    // The banner should suppress itself on mount because sessionStorage says
    // the user already dismissed it in this tab.
    expect(screen.queryByText(/trial ends in/i)).not.toBeInTheDocument();
  });

  it("re-renders the banner when the status changes (dismissal resets)", () => {
    const trial_ends_at = new Date(Date.now() + 5 * 86_400_000).toISOString();

    useSubscriptionMock.mockReturnValue(makeSubscription({ status: "trialing", trial_ends_at }));

    const { rerender } = renderWithRouter(<SubscriptionBanner />);

    // Simulate the user dismissing the trial banner.
    fireEvent.click(screen.getByRole("button", { name: /^dismiss$/i }));

    expect(screen.queryByText(/trial ends in/i)).not.toBeInTheDocument();

    // Backend flips the tenant into past_due — the banner should reappear
    // (danger is non-dismissable AND the useEffect resets dismissed state).
    useSubscriptionMock.mockReturnValue(
      makeSubscription({ status: "past_due" as SubscriptionStatus }),
    );

    // rerender is the raw testing-library rerender — it does NOT
    // re-run the test wrapper. The banner still lives under the
    // routing context established by the first render, so we pass
    // the raw component here.
    rerender(<SubscriptionBanner />);

    expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
  });
});
