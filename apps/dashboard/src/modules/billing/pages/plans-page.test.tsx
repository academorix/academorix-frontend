/**
 * @file plans-page.test.tsx
 * @module modules/billing/pages/plans-page.test
 *
 * @description
 * Component tests for the `/settings/billing/plans` page. Mocks:
 *
 * - `usePlans` — the live/fallback plans catalog hook.
 * - `useSubscription` — the identity-derived subscription snapshot.
 * - Refine's `useCan` — the RBAC guard used by `<ResourceAccessGuard>`;
 *   allowed in every test so we can assert on the body.
 * - The shared Breadcrumbs hooks — passthrough via `importOriginal` so
 *   the router-aware breadcrumb component still mounts.
 *
 * Coverage:
 *   1. The heading + plan cards render when the catalog resolves.
 *   2. The card matching the tenant's current plan (by `tier`) shows a
 *      "Current plan" chip and disables its Change plan button.
 *   3. Non-current plan cards render an enabled Change plan button.
 *   4. Empty catalog → "Coming soon" placeholder.
 *   5. Loading + error banners render.
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Plan, SubscriptionSummary } from "@/types";
import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────

const usePlansMock = vi.fn();
const useSubscriptionMock = vi.fn();

vi.mock("@/lib/billing", async () => {
  const actual = await vi.importActual<typeof import("@/lib/billing")>("@/lib/billing");

  return {
    ...actual,
    usePlans: () => usePlansMock(),
    useSubscription: () => useSubscriptionMock(),
  };
});

// Refine passthrough — allow access via useCan; keep other hooks real so the
// shared Breadcrumbs component keeps working.
vi.mock("@refinedev/core", async () => {
  const actual = await vi.importActual<typeof import("@refinedev/core")>("@refinedev/core");

  return {
    ...actual,
    useCan: () => ({ data: { can: true }, isLoading: false }),
    useResourceParams: () => ({ resource: undefined, identifier: "subscription" }),
    useTranslate: () => (_key: string, fallback: string) => fallback,
    useGetIdentity: () => ({ data: undefined }),
  };
});

// Import AFTER the mocks.
import BillingPlansPage from "@/modules/billing/pages/plans-page";

// ─────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: "plan_starter_monthly",
    name: "Starter",
    tier: "starter",
    cadence: "monthly",
    price: "0.00",
    currency: "USD",
    features: ["single_branch", "scheduling", "attendance"],
    quotas: { athlete_slot: 100 },
  },
  {
    id: "plan_growth_monthly",
    name: "Growth",
    tier: "growth",
    cadence: "monthly",
    price: "99.00",
    currency: "USD",
    features: ["scheduling", "attendance", "priority_support"],
    quotas: { athlete_slot: 500 },
  },
  {
    id: "plan_enterprise_monthly",
    name: "Enterprise",
    tier: "enterprise",
    cadence: "monthly",
    price: "0.00",
    currency: "USD",
    features: ["sso", "audit_log"],
    quotas: { athlete_slot: null },
  },
];

const GROWTH_SUBSCRIPTION: SubscriptionSummary = {
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
};

/** Wraps the page in a MemoryRouter — Breadcrumbs uses router hooks. */
function renderPage(ui: ReactNode = <BillingPlansPage />) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

beforeEach(() => {
  usePlansMock.mockReset();
  useSubscriptionMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────

describe("BillingPlansPage", () => {
  it("renders the page heading + one card per plan", () => {
    usePlansMock.mockReturnValue({
      plans: PLANS,
      isLoading: false,
      error: null,
      defaultPlanId: null,
    });
    useSubscriptionMock.mockReturnValue(null);

    renderPage();

    expect(screen.getByRole("heading", { name: /^plans$/i, level: 1 })).toBeInTheDocument();
    // Each plan's card renders a Card.Title with the human label.
    expect(screen.getByRole("heading", { name: /^starter$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^growth$/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^enterprise$/i })).toBeInTheDocument();
  });

  it("highlights the current plan with a chip and disables its button", () => {
    usePlansMock.mockReturnValue({
      plans: PLANS,
      isLoading: false,
      error: null,
      defaultPlanId: null,
    });
    useSubscriptionMock.mockReturnValue(GROWTH_SUBSCRIPTION);

    renderPage();

    // The chip + the disabled button both render "Current plan"; both are
    // acceptable signals of "this is the tenant's active tier".
    expect(screen.getAllByText(/current plan/i).length).toBeGreaterThanOrEqual(2);

    // Growth's "Change plan" affordance is replaced by a disabled "Current plan" button.
    const currentPlanButton = screen.getByRole("button", { name: /^current plan$/i });

    expect(currentPlanButton).toBeDisabled();

    // Non-current plans still expose "Change to <plan>" buttons.
    expect(
      screen.getByRole("button", { name: /change to starter/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /change to enterprise/i }),
    ).toBeInTheDocument();
  });

  it("renders enabled Change plan buttons for every plan when there's no subscription", () => {
    usePlansMock.mockReturnValue({
      plans: PLANS,
      isLoading: false,
      error: null,
      defaultPlanId: null,
    });
    useSubscriptionMock.mockReturnValue(null);

    renderPage();

    // No "Current plan" text anywhere on the page.
    expect(screen.queryByText(/current plan/i)).not.toBeInTheDocument();

    for (const label of ["Starter", "Growth", "Enterprise"]) {
      const button = screen.getByRole("button", { name: new RegExp(`change to ${label}`, "i") });

      expect(button).toBeEnabled();
    }
  });

  it("renders the enterprise 'Custom' price label instead of a $0.00 tag", () => {
    usePlansMock.mockReturnValue({
      plans: PLANS,
      isLoading: false,
      error: null,
      defaultPlanId: null,
    });
    useSubscriptionMock.mockReturnValue(null);

    renderPage();

    expect(screen.getByText(/^custom$/i)).toBeInTheDocument();
  });

  it("renders the 'Coming soon' empty state when the catalog is empty", () => {
    usePlansMock.mockReturnValue({
      plans: [],
      isLoading: false,
      error: null,
      defaultPlanId: null,
    });
    useSubscriptionMock.mockReturnValue(null);

    renderPage();

    expect(screen.getByRole("heading", { name: /plans coming soon/i })).toBeInTheDocument();
  });

  it("renders a spinner while plans are loading", () => {
    usePlansMock.mockReturnValue({
      plans: [],
      isLoading: true,
      error: null,
      defaultPlanId: null,
    });
    useSubscriptionMock.mockReturnValue(null);

    renderPage();

    expect(screen.getByLabelText(/loading plans/i)).toBeInTheDocument();
  });

  it("renders an error banner when the catalog fetch fails", () => {
    usePlansMock.mockReturnValue({
      plans: [],
      isLoading: false,
      error: new Error("plans endpoint down"),
      defaultPlanId: null,
    });
    useSubscriptionMock.mockReturnValue(null);

    renderPage();

    expect(screen.getByText(/plans endpoint down/i)).toBeInTheDocument();
  });

  it("matches the current plan by tier when plan_id differs (across-version stable id)", () => {
    usePlansMock.mockReturnValue({
      plans: PLANS,
      isLoading: false,
      error: null,
      defaultPlanId: null,
    });
    // Growth subscription but with a different plan_id (e.g. version 2) —
    // the tier fallback should still highlight the growth card.
    useSubscriptionMock.mockReturnValue({ ...GROWTH_SUBSCRIPTION, plan_id: 9999 });

    renderPage();

    // Chip + button both surface "Current plan" — at least two matches.
    expect(screen.getAllByText(/current plan/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("button", { name: /^current plan$/i })).toBeDisabled();
  });
});
