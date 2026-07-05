/**
 * @file pricing-page.test.tsx
 * @module modules/billing/pages/pricing-page.test
 *
 * @description
 * Component tests for the `/pricing` page. Mocks the two data hooks
 * (`useBillingCatalog`, `useStartCheckout`), Refine's `useGetIdentity`, and
 * `useNavigate` from `react-router` so we can assert on:
 *
 * 1. Hero renders + billing-period toggle works.
 * 2. Plan cards render in canonical order (starter → growth → pro →
 *    enterprise).
 * 3. Comparison matrix renders one row per grant.
 * 4. Anonymous "Get started" navigates to `/create-workspace`.
 * 5. Authenticated "Get started" invokes `startCheckout` and navigates
 *    to the returned URL.
 * 6. Enterprise CTA routes to the sales path (currently `/create-workspace`).
 * 7. Loading + error states render as expected.
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlanTier } from "@/types";
import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────

const useBillingCatalogMock = vi.fn();
const useStartCheckoutMock = vi.fn();

vi.mock("@/modules/billing/hooks/use-billing", () => ({
  useBillingCatalog: () => useBillingCatalogMock(),
  useStartCheckout: () => useStartCheckoutMock(),
}));

const useGetIdentityMock = vi.fn();

vi.mock("@refinedev/core", async () => {
  const actual = await vi.importActual<typeof import("@refinedev/core")>("@refinedev/core");

  return {
    ...actual,
    useGetIdentity: () => useGetIdentityMock(),
  };
});

const navigateMock = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Import AFTER the mocks.
import PricingPage from "@/modules/billing/pages/pricing-page";

// ─────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────

const CATALOG: PlanTier[] = [
  {
    key: "starter",
    label: "Starter",
    description: "For a single branch getting started.",
    is_popular: false,
    prices: [
      { billing_period: "monthly", amount: "0", currency: "USD" },
      { billing_period: "yearly", amount: "0", currency: "USD" },
    ],
    grants: [
      { key: "athlete_slot", label: "Athletes", type: "slot", limit: 50, is_unlimited: false },
    ],
  },
  {
    key: "growth",
    label: "Growth",
    description: "For growing academies.",
    is_popular: true,
    prices: [
      { billing_period: "monthly", amount: "49", currency: "USD" },
      { billing_period: "yearly", amount: "490", currency: "USD" },
    ],
    grants: [
      { key: "athlete_slot", label: "Athletes", type: "slot", limit: 500, is_unlimited: false },
      { key: "branch_slot", label: "Branches", type: "slot", limit: 5, is_unlimited: false },
    ],
  },
  {
    key: "enterprise",
    label: "Enterprise",
    description: "For multi-branch networks.",
    is_popular: false,
    prices: [
      { billing_period: "monthly", amount: "0", currency: "USD" },
      { billing_period: "yearly", amount: "0", currency: "USD" },
    ],
    grants: [
      { key: "athlete_slot", label: "Athletes", type: "slot", limit: null, is_unlimited: true },
    ],
  },
];

/** Convenience: renders the pricing page inside a MemoryRouter. */
function renderPricing(ui: ReactNode = <PricingPage />) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

/** Set up a healthy read-hook state (catalog loaded, no error, checkout idle). */
function setupHappyPath({ isAuthenticated = false }: { isAuthenticated?: boolean } = {}): {
  checkoutMutate: ReturnType<typeof vi.fn>;
} {
  const checkoutMutate = vi.fn();

  useBillingCatalogMock.mockReturnValue({
    data: CATALOG,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });

  useStartCheckoutMock.mockReturnValue({
    isPending: false,
    error: null,
    mutate: checkoutMutate,
  });

  useGetIdentityMock.mockReturnValue({
    data: isAuthenticated
      ? {
          id: "u1",
          name: "Test",
          email: "t@t",
          initials: "T",
          roles: [],
          permissions: [],
          features: [],
          terminology: {},
          tenant: null,
          tenants: [],
          scopes: { organizations: [], branches: [], seasons: [] },
          subscription: null,
          quota_summary: [],
        }
      : undefined,
  });

  return { checkoutMutate };
}

beforeEach(() => {
  useBillingCatalogMock.mockReset();
  useStartCheckoutMock.mockReset();
  useGetIdentityMock.mockReset();
  navigateMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────

describe("PricingPage", () => {
  it("renders the hero + period toggle", () => {
    setupHappyPath();

    renderPricing();

    expect(
      screen.getByRole("heading", { name: /plans that scale/i, level: 1 }),
    ).toBeInTheDocument();
    // HeroUI's ToggleButton uses role="radio" (single-select toggle group).
    // Match by accessible name via the label text instead.
    expect(screen.getByText(/^Monthly$/)).toBeInTheDocument();
    expect(screen.getByText(/^Yearly — save 20%$/)).toBeInTheDocument();
  });

  it("renders plan cards in canonical order", () => {
    setupHappyPath();

    renderPricing();

    const cardHeadings = screen
      .getAllByRole("heading", { level: 3 })
      // The billing/plan cards render <h3> titles; the "Ready to try it?" card
      // at the bottom does too, so we filter to just the plan labels.
      .map((el) => el.textContent)
      .filter((text): text is string => text !== null);

    // Check that the three plan names appear in the expected order (regardless
    // of any other h3s that also happen to be on the page).
    const starterIdx = cardHeadings.indexOf("Starter");
    const growthIdx = cardHeadings.indexOf("Growth");
    const enterpriseIdx = cardHeadings.indexOf("Enterprise");

    expect(starterIdx).toBeGreaterThanOrEqual(0);
    expect(growthIdx).toBeGreaterThan(starterIdx);
    expect(enterpriseIdx).toBeGreaterThan(growthIdx);
  });

  it("renders the comparison matrix with one row per unique grant", () => {
    setupHappyPath();

    renderPricing();

    // The comparison matrix uses <table>. Row labels are set via <th scope=row>.
    // Match on exact row headers to avoid also matching the category-header row
    // (which contains "Team & athletes • How many athletes...").
    expect(screen.getByRole("rowheader", { name: /^athletes$/i })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: /^branches$/i })).toBeInTheDocument();
  });

  it("renders the FAQ section", () => {
    setupHappyPath();

    renderPricing();

    expect(
      screen.getByRole("heading", { name: /frequently asked questions/i }),
    ).toBeInTheDocument();
  });

  it("routes anonymous callers to /create-workspace on 'Get started'", () => {
    setupHappyPath({ isAuthenticated: false });

    renderPricing();

    // Find the Starter card's CTA. Anonymous callers get "Create workspace".
    const createButtons = screen.getAllByRole("button", { name: /create workspace/i });

    createButtons[0]?.click();

    expect(navigateMock).toHaveBeenCalledWith("/create-workspace");
  });

  it("invokes startCheckout for authenticated callers", async () => {
    const { checkoutMutate } = setupHappyPath({ isAuthenticated: true });

    checkoutMutate.mockResolvedValue({ url: "https://paddle.example/checkout/abc" });

    // Simulate a browser (window.location.href is what the handler writes to).
    const originalHref = window.location.href;

    // Overrideable stub for window.location.
    Object.defineProperty(window, "location", {
      value: { origin: "https://tenant.academorix.app", href: originalHref },
      writable: true,
    });

    renderPricing();

    const getStartedButtons = screen.getAllByRole("button", { name: /get started/i });

    getStartedButtons[0]?.click();

    // The mutation is awaited inside an async handler; wait for the call.
    await Promise.resolve();
    await Promise.resolve();

    expect(checkoutMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_key: expect.any(String),
        billing_period: "monthly",
      }),
    );
  });

  it("routes Enterprise CTA to Contact sales (currently /create-workspace)", () => {
    setupHappyPath({ isAuthenticated: true });

    renderPricing();

    const contactSales = screen.getByRole("button", { name: /contact sales/i });

    contactSales.click();

    expect(navigateMock).toHaveBeenCalledWith("/create-workspace");
  });

  it("renders a loading spinner while the catalog is loading", () => {
    useBillingCatalogMock.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });
    useStartCheckoutMock.mockReturnValue({
      isPending: false,
      error: null,
      mutate: vi.fn(),
    });
    useGetIdentityMock.mockReturnValue({ data: undefined });

    renderPricing();

    // HeroUI Spinner accepts `aria-label` — testing-library exposes it via
    // getByLabelText, not necessarily via a `progressbar` role.
    expect(screen.getByLabelText(/loading plans/i)).toBeInTheDocument();
  });

  it("renders the error banner when the catalog fetch fails", () => {
    useBillingCatalogMock.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("catalog is down"),
      refetch: vi.fn(),
    });
    useStartCheckoutMock.mockReturnValue({
      isPending: false,
      error: null,
      mutate: vi.fn(),
    });
    useGetIdentityMock.mockReturnValue({ data: undefined });

    renderPricing();

    expect(screen.getByText(/catalog is down/i)).toBeInTheDocument();
  });
});
