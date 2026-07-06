/**
 * @file list.test.tsx
 * @module modules/entitlements/pages/list.test
 *
 * @description
 * Component tests for the `/usage` page (`EntitlementsUsagePage`).
 * Mocks the sole data hook (`useEntitlementsUsage`), the Refine access
 * primitives so `<ResourceAccessGuard>` grants access, and the QuotaMeter's
 * `useQuotaFor` (called by the meter but the page passes labels + keys).
 *
 * Covers:
 *   1. Groups grants into slot / pool / feature sections and renders each.
 *   2. Renders feature rows with enabled/disabled indicators.
 *   3. Unlimited slot rows render as "Unlimited" pills.
 *   4. Empty-response state renders a friendly onboarding message.
 *   5. Loading + error states render.
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EntitlementUsage, QuotaHeadline } from "@/types";
import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────

const useEntitlementsUsageMock = vi.fn();

vi.mock("@/modules/entitlements/hooks/use-entitlements", () => ({
  useEntitlementsUsage: () => useEntitlementsUsageMock(),
}));

/**
 * The page composes `<QuotaMeter>` for metered rows. QuotaMeter's own tests
 * cover its variants; here we only need a stubbed `useQuotaFor` that lets
 * the meter render its bar (returns a valid QuotaHeadline for any key we ask
 * for). The MeterRow in list.tsx short-circuits before reaching QuotaMeter
 * when a grant is unlimited/limit=null, so we only stub the metered case.
 */
const useQuotaForMock = vi.fn();

vi.mock("@/lib/billing", async () => {
  const actual = await vi.importActual<typeof import("@/lib/billing")>("@/lib/billing");

  return {
    ...actual,
    useQuotaFor: (key: string) => useQuotaForMock(key),
  };
});

// Refine passthrough — allow access via useCan; keep other hooks real so the
// shared Breadcrumbs component keeps working.
vi.mock("@refinedev/core", async () => {
  const actual = await vi.importActual<typeof import("@refinedev/core")>("@refinedev/core");

  return {
    ...actual,
    useCan: () => ({ data: { can: true }, isLoading: false }),
    useResourceParams: () => ({ resource: undefined, identifier: "entitlements" }),
    useTranslate: () => (_key: string, fallback: string) => fallback,
    useGetIdentity: () => ({ data: undefined }),
  };
});

// Import AFTER the mocks.
import EntitlementsUsagePage from "@/modules/entitlements/pages/list";

// ─────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────

const METERED_SLOT: EntitlementUsage = {
  key: "athlete_slot",
  label: "Athletes",
  type: "slot",
  used: 47,
  limit: 100,
  is_unlimited: false,
};

const UNLIMITED_SLOT: EntitlementUsage = {
  key: "team_slot",
  label: "Teams",
  type: "slot",
  used: 6,
  limit: null,
  is_unlimited: true,
};

const POOL_ROW: EntitlementUsage = {
  key: "message_pool",
  label: "Messages",
  type: "pool",
  used: 250,
  limit: 1000,
  is_unlimited: false,
};

const ENABLED_FEATURE: EntitlementUsage = {
  key: "sso_feature",
  label: "SSO",
  type: "feature",
  used: 0,
  limit: 1,
  is_unlimited: false,
};

const DISABLED_FEATURE: EntitlementUsage = {
  key: "audit_feature",
  label: "Audit log",
  type: "feature",
  used: 0,
  limit: 0,
  is_unlimited: false,
};

/** Wraps the page in MemoryRouter (Breadcrumbs uses router hooks internally). */
function renderPage(ui: ReactNode = <EntitlementsUsagePage />) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

/**
 * Returns a matching {@link QuotaHeadline} for a given entitlement key based
 * on the fixtures above. The page's `MeterRow` component then feeds this to
 * QuotaMeter to render the bar.
 */
function quotaForFixture(key: string): QuotaHeadline | undefined {
  const fixtures: EntitlementUsage[] = [METERED_SLOT, POOL_ROW];
  const match = fixtures.find((entry) => entry.key === key);

  return match ? { key: match.key, used: match.used, limit: match.limit } : undefined;
}

beforeEach(() => {
  useEntitlementsUsageMock.mockReset();
  useQuotaForMock.mockReset();
  useQuotaForMock.mockImplementation(quotaForFixture);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────

describe("EntitlementsUsagePage", () => {
  it("renders the page heading and description", () => {
    useEntitlementsUsageMock.mockReturnValue({
      data: [METERED_SLOT],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByRole("heading", { name: /usage & limits/i, level: 1 })).toBeInTheDocument();
  });

  it("groups grants into slot / pool / feature sections", () => {
    useEntitlementsUsageMock.mockReturnValue({
      data: [METERED_SLOT, POOL_ROW, ENABLED_FEATURE],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    // Each section renders its own Card with a title.
    expect(screen.getByRole("heading", { name: /metered slots/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /pools/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /features/i })).toBeInTheDocument();
  });

  it("renders a metered slot via QuotaMeter (card variant)", () => {
    useEntitlementsUsageMock.mockReturnValue({
      data: [METERED_SLOT],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    // QuotaMeter renders "47 / 100" and a progressbar.
    expect(screen.getByText("47 / 100")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /athletes usage/i })).toBeInTheDocument();
  });

  it("renders an unlimited slot as an 'Unlimited' pill (bypasses QuotaMeter)", () => {
    useEntitlementsUsageMock.mockReturnValue({
      data: [UNLIMITED_SLOT],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("Teams")).toBeInTheDocument();
    expect(screen.getByText(/^unlimited$/i)).toBeInTheDocument();
    expect(screen.getByText(/6 in use/i)).toBeInTheDocument();
  });

  it("marks an enabled feature as 'Enabled'", () => {
    useEntitlementsUsageMock.mockReturnValue({
      data: [ENABLED_FEATURE],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("SSO")).toBeInTheDocument();
    expect(screen.getByText(/^enabled$/i)).toBeInTheDocument();
  });

  it("marks a disabled feature as 'Not included'", () => {
    useEntitlementsUsageMock.mockReturnValue({
      data: [DISABLED_FEATURE],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("Audit log")).toBeInTheDocument();
    expect(screen.getByText(/not included/i)).toBeInTheDocument();
  });

  it("renders the empty-state onboarding message when there are no grants", () => {
    useEntitlementsUsageMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText(/doesn'?t include any entitlements/i)).toBeInTheDocument();
  });

  it("renders a loading spinner while entitlements load", () => {
    useEntitlementsUsageMock.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByLabelText(/loading entitlements/i)).toBeInTheDocument();
  });

  it("renders the error banner when the fetch fails", () => {
    useEntitlementsUsageMock.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("entitlements down"),
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText(/entitlements down/i)).toBeInTheDocument();
  });
});
