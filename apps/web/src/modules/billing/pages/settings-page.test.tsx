/**
 * @file settings-page.test.tsx
 * @module modules/billing/pages/settings-page.test
 *
 * @description
 * Component tests for the `/settings/billing` page. Mocks:
 *
 * - `useBillingStatus`, `useBillingInvoices` — data hooks.
 * - `usePauseSubscription`, `useResumeSubscription`, `useCancelSubscription`,
 *   `useOpenBillingPortal` — mutation hooks.
 * - `useSubscription`, `useQuotaSummary`, `bannerFor` — the identity-derived
 *   read hooks used by the QuotasCard.
 * - Refine's `useCan` — the RBAC guard used by `<ResourceAccessGuard>`. We
 *   allow access in every test so component-level assertions can run.
 * - `useNavigate` from `react-router` — the CTA navigations.
 *
 * Covers:
 *   1. Choose-a-plan card renders when subscription is null.
 *   2. Plan card renders with status chip and change-plan/pause buttons.
 *   3. Change plan navigates to `/pricing`.
 *   4. Pause / Resume / Cancel mutations fire and refetch.
 *   5. Loading + error states render.
 *   6. Invoices table renders per invoice.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BillingInvoice, SubscriptionSummary } from "@/types";
import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────
// Mocks — the settings page depends on a small ecosystem of hooks
// ─────────────────────────────────────────────────────────────────────

const useBillingStatusMock = vi.fn();
const useBillingInvoicesMock = vi.fn();
const pauseMutate = vi.fn();
const resumeMutate = vi.fn();
const cancelMutate = vi.fn();
const portalMutate = vi.fn();

vi.mock("@/modules/billing/hooks/use-billing", () => ({
  useBillingStatus: () => useBillingStatusMock(),
  useBillingInvoices: () => useBillingInvoicesMock(),
  usePauseSubscription: () => ({ isPending: false, error: null, mutate: pauseMutate }),
  useResumeSubscription: () => ({ isPending: false, error: null, mutate: resumeMutate }),
  useCancelSubscription: () => ({ isPending: false, error: null, mutate: cancelMutate }),
  useOpenBillingPortal: () => ({ isPending: false, error: null, mutate: portalMutate }),
}));

const useSubscriptionMock = vi.fn();
const useQuotaSummaryMock = vi.fn();

vi.mock("@/lib/billing", async () => {
  const actual = await vi.importActual<typeof import("@/lib/billing")>("@/lib/billing");

  return {
    ...actual,
    useSubscription: () => useSubscriptionMock(),
    useQuotaSummary: () => useQuotaSummaryMock(),
  };
});

// The ResourceAccessGuard uses Refine's `useCan` to gate — we allow access
// so the guarded body renders in these tests. We passthrough the rest of the
// Refine surface via importOriginal so unrelated hooks (like `useBreadcrumb`
// used by the shared Breadcrumbs component) keep working.
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

const navigateMock = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

// Import AFTER the mocks.
import BillingSettingsPage from "@/modules/billing/pages/settings-page";

// ─────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────

const ACTIVE_SUBSCRIPTION: SubscriptionSummary = {
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

const PAID_INVOICE: BillingInvoice = {
  id: "in_1",
  number: "INV-001",
  issued_at: "2026-06-01T00:00:00Z",
  due_at: null,
  paid_at: "2026-06-01T00:00:00Z",
  status: "paid",
  total: "49.00",
  currency: "USD",
  pdf_url: "https://example/invoices/in_1.pdf",
};

/** Wraps the page in a MemoryRouter (settings page uses `useNavigate`). */
function renderPage(ui: ReactNode = <BillingSettingsPage />) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

/** Set up a happy-path state: active sub, one paid invoice, no quotas. */
function setupHappyPath(): void {
  useBillingStatusMock.mockReturnValue({
    data: ACTIVE_SUBSCRIPTION,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
  useBillingInvoicesMock.mockReturnValue({
    data: [PAID_INVOICE],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
  useSubscriptionMock.mockReturnValue(ACTIVE_SUBSCRIPTION);
  useQuotaSummaryMock.mockReturnValue([]);
}

beforeEach(() => {
  useBillingStatusMock.mockReset();
  useBillingInvoicesMock.mockReset();
  useSubscriptionMock.mockReset();
  useQuotaSummaryMock.mockReset();
  pauseMutate.mockReset();
  resumeMutate.mockReset();
  cancelMutate.mockReset();
  portalMutate.mockReset();
  navigateMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────

describe("BillingSettingsPage", () => {
  it("renders the ChooseAPlan card when there is no subscription", () => {
    useBillingStatusMock.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    useBillingInvoicesMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    useSubscriptionMock.mockReturnValue(null);
    useQuotaSummaryMock.mockReturnValue([]);

    renderPage();

    expect(screen.getByRole("heading", { name: /choose a plan/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /see plans/i })).toBeInTheDocument();
  });

  it("renders the PlanCard with plan label + status chip", () => {
    setupHappyPath();

    renderPage();

    // Plan label appears in the Card.Title.
    expect(screen.getByText(/growth/i)).toBeInTheDocument();
    // Status chip. Case-sensitive label matches SUBSCRIPTION_STATUS_LABELS.
    expect(screen.getByText("Active")).toBeInTheDocument();
    // Primary actions are present for an active subscription.
    expect(screen.getByRole("button", { name: /change plan/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /manage in portal/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel subscription/i })).toBeInTheDocument();
  });

  it("navigates to /pricing when 'Change plan' is clicked", () => {
    setupHappyPath();

    renderPage();

    screen.getByRole("button", { name: /change plan/i }).click();

    expect(navigateMock).toHaveBeenCalledWith("/pricing");
  });

  it("invokes pause() and refetches on 'Pause' click", async () => {
    const refetch = vi.fn();

    useBillingStatusMock.mockReturnValue({
      data: ACTIVE_SUBSCRIPTION,
      isLoading: false,
      error: null,
      refetch,
    });
    useBillingInvoicesMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    useSubscriptionMock.mockReturnValue(ACTIVE_SUBSCRIPTION);
    useQuotaSummaryMock.mockReturnValue([]);
    pauseMutate.mockResolvedValueOnce({ ...ACTIVE_SUBSCRIPTION, status: "paused" });

    renderPage();

    screen.getByRole("button", { name: /pause/i }).click();

    await waitFor(() => {
      expect(pauseMutate).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });

  it("renders the Resume button for a paused subscription", () => {
    useBillingStatusMock.mockReturnValue({
      data: { ...ACTIVE_SUBSCRIPTION, status: "paused" as const },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    useBillingInvoicesMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    useSubscriptionMock.mockReturnValue({ ...ACTIVE_SUBSCRIPTION, status: "paused" });
    useQuotaSummaryMock.mockReturnValue([]);

    renderPage();

    expect(screen.getByRole("button", { name: /^resume$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^pause$/i })).not.toBeInTheDocument();
  });

  it("requires confirmation before calling cancel()", () => {
    setupHappyPath();

    // Stub window.confirm — return false so cancel never fires.
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderPage();

    screen.getByRole("button", { name: /cancel subscription/i }).click();

    expect(confirmSpy).toHaveBeenCalled();
    expect(cancelMutate).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("calls cancel() when the confirmation is accepted", async () => {
    setupHappyPath();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    cancelMutate.mockResolvedValueOnce({ ...ACTIVE_SUBSCRIPTION, status: "canceled" });

    renderPage();

    screen.getByRole("button", { name: /cancel subscription/i }).click();

    await waitFor(() => {
      expect(cancelMutate).toHaveBeenCalledTimes(1);
    });
  });

  it("renders the invoices table with per-invoice PDF links", () => {
    setupHappyPath();

    renderPage();

    expect(screen.getByText("INV-001")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /download pdf/i })).toHaveAttribute(
      "href",
      PAID_INVOICE.pdf_url,
    );
  });

  it("renders a loading spinner while the subscription is loading", () => {
    useBillingStatusMock.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });
    useBillingInvoicesMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    useSubscriptionMock.mockReturnValue(null);
    useQuotaSummaryMock.mockReturnValue([]);

    renderPage();

    expect(screen.getByLabelText(/loading subscription/i)).toBeInTheDocument();
  });

  it("renders the error banner when the status fetch fails", () => {
    useBillingStatusMock.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("status is down"),
      refetch: vi.fn(),
    });
    useBillingInvoicesMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    useSubscriptionMock.mockReturnValue(null);
    useQuotaSummaryMock.mockReturnValue([]);

    renderPage();

    expect(screen.getByText(/status is down/i)).toBeInTheDocument();
  });
});
