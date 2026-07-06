/**
 * @file subscription-status.test.ts
 * @module lib/billing/subscription-status.test
 *
 * @description
 * Unit tests for {@link bannerFor} — the pure decision function that maps a
 * `SubscriptionSummary` (or `null`) to the banner descriptor the shell should
 * render. One case per lifecycle status plus the "no subscription yet"
 * onboarding case, since the banner state machine is the single source of
 * truth the whole shell relies on.
 *
 * Also covers {@link subscriptionStatusLabel} which is a trivial map lookup
 * but is publicly exported and used in a few places (chip, tests, docs).
 */

import { describe, expect, it } from "vitest";

import type { SubscriptionStatus, SubscriptionSummary } from "@/types";

import { bannerFor, subscriptionStatusLabel } from "@/lib/billing/subscription-status";

/**
 * Builds a plausible {@link SubscriptionSummary} for a test. Override just
 * the fields the case exercises; the rest stay at healthy defaults.
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

describe("bannerFor", () => {
  it("returns an onboarding banner when there is no subscription", () => {
    const banner = bannerFor(null);

    expect(banner).not.toBeNull();
    expect(banner?.tone).toBe("info");
    expect(banner?.title).toMatch(/choose a plan/i);
    expect(banner?.ctaHref).toBe("/settings/billing");
    expect(banner?.dismissable).toBe(false);
  });

  it("routes the onboarding CTA to the caller-provided billing path", () => {
    const banner = bannerFor(null, "/custom/billing");

    expect(banner?.ctaHref).toBe("/custom/billing");
  });

  it("returns null (silent) for active subscriptions", () => {
    expect(bannerFor(makeSubscription({ status: "active" }))).toBeNull();
  });

  it("returns null for an unknown status (forward-compatibility)", () => {
    const forwardCompat = makeSubscription({
      status: "future_state" as unknown as SubscriptionStatus,
    });

    expect(bannerFor(forwardCompat)).toBeNull();
  });

  it("shows an info banner during trial with the day countdown", () => {
    // 5 days from now — deterministic value based on Date.now().
    const trial_ends_at = new Date(Date.now() + 5 * 86_400_000).toISOString();
    const banner = bannerFor(makeSubscription({ status: "trialing", trial_ends_at }));

    expect(banner?.tone).toBe("info");
    expect(banner?.title).toMatch(/trial ends in 5 days/i);
    expect(banner?.dismissable).toBe(true);
  });

  it("handles the singular 'day' case for a trial with 1 day left", () => {
    const trial_ends_at = new Date(Date.now() + 1 * 86_400_000).toISOString();
    const banner = bannerFor(makeSubscription({ status: "trialing", trial_ends_at }));

    expect(banner?.title).toMatch(/trial ends in 1 day\b/i);
    expect(banner?.title).not.toMatch(/1 days/i);
  });

  it("falls back to a generic trial banner when trial_ends_at is null", () => {
    const banner = bannerFor(makeSubscription({ status: "trialing", trial_ends_at: null }));

    expect(banner?.tone).toBe("info");
    expect(banner?.title).toMatch(/you.?re on a trial/i);
  });

  it("shows a non-dismissable danger banner when past_due", () => {
    const banner = bannerFor(makeSubscription({ status: "past_due" }));

    expect(banner?.tone).toBe("danger");
    expect(banner?.title).toMatch(/payment failed/i);
    expect(banner?.dismissable).toBe(false);
    expect(banner?.ctaLabel).toMatch(/update payment/i);
  });

  it("shows a non-dismissable danger banner when in grace", () => {
    const banner = bannerFor(
      makeSubscription({
        status: "grace",
        grace_ends_at: "2026-08-05T00:00:00+00:00",
      }),
    );

    expect(banner?.tone).toBe("danger");
    expect(banner?.title).toMatch(/grace period ends/i);
    expect(banner?.dismissable).toBe(false);
  });

  it("shows a non-dismissable danger banner when suspended", () => {
    const banner = bannerFor(makeSubscription({ status: "suspended" }));

    expect(banner?.tone).toBe("danger");
    expect(banner?.title).toMatch(/subscription suspended/i);
    expect(banner?.dismissable).toBe(false);
    expect(banner?.ctaLabel).toMatch(/reactivate/i);
  });

  it("shows a warning banner when paused", () => {
    const banner = bannerFor(makeSubscription({ status: "paused" }));

    expect(banner?.tone).toBe("warning");
    expect(banner?.title).toMatch(/subscription paused/i);
    expect(banner?.dismissable).toBe(false);
    expect(banner?.ctaLabel).toMatch(/resume/i);
  });

  it("shows a warning banner when canceled with the end-of-period countdown", () => {
    const banner = bannerFor(
      makeSubscription({
        status: "canceled",
        current_period_ends_at: "2026-08-15T00:00:00+00:00",
      }),
    );

    expect(banner?.tone).toBe("warning");
    expect(banner?.title).toMatch(/access ends/i);
    expect(banner?.dismissable).toBe(false);
    expect(banner?.ctaLabel).toMatch(/reactivate/i);
  });

  it("falls back to a generic canceled banner when no current_period_ends_at is set", () => {
    const banner = bannerFor(
      makeSubscription({
        status: "canceled",
        current_period_ends_at: null,
      }),
    );

    expect(banner?.title).toMatch(/subscription canceled/i);
  });
});

describe("subscriptionStatusLabel", () => {
  it.each<[SubscriptionStatus, RegExp]>([
    ["trialing", /trialing/i],
    ["active", /active/i],
    ["past_due", /past due/i],
    ["grace", /grace/i],
    ["suspended", /suspended/i],
    ["paused", /paused/i],
    ["canceled", /canceled/i],
  ])("labels %s status as %s", (status, expected) => {
    expect(subscriptionStatusLabel(status)).toMatch(expected);
  });

  it("returns the raw status for unknown values (forward-compatibility)", () => {
    expect(subscriptionStatusLabel("future_state" as SubscriptionStatus)).toBe("future_state");
  });
});
