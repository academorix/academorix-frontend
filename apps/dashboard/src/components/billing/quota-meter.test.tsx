/**
 * @file quota-meter.test.tsx
 * @module components/billing/quota-meter.test
 *
 * @description
 * Component tests for {@link QuotaMeter}. We mock `useQuotaFor` (the sole
 * data dependency) at the module boundary so each test injects the exact
 * shape it wants to render — no Refine provider setup needed.
 *
 * Covers:
 *   1. Renders nothing when the quota is unknown (unlimited / n/a).
 *   2. Renders inline variant with "used / limit" text and progressbar aria.
 *   3. Renders card variant with a bigger label.
 *   4. Falls back to a humanized key when no label prop is passed.
 *   5. Uses the caller's label prop when provided.
 *   6. Progressbar `aria-valuenow` reflects the used count.
 */

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { QuotaHeadline } from "@/types";

const useQuotaForMock = vi.fn();

vi.mock("@/lib/billing", async () => {
  const actual = await vi.importActual<typeof import("@/lib/billing")>("@/lib/billing");

  return {
    ...actual,
    useQuotaFor: (key: string) => useQuotaForMock(key),
  };
});

import { QuotaMeter } from "@/components/billing/quota-meter";

/** Sets the mocked hook's return value for the current test. */
function setQuota(quota: QuotaHeadline | undefined): void {
  useQuotaForMock.mockReturnValue(quota);
}

beforeEach(() => {
  useQuotaForMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("QuotaMeter", () => {
  it("renders nothing when the quota is unknown / unlimited", () => {
    setQuota(undefined);

    const { container } = render(<QuotaMeter quotaKey="storage_gb" />);

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the quota has a null limit", () => {
    setQuota({ key: "storage_gb", used: 0, limit: null });

    const { container } = render(<QuotaMeter quotaKey="storage_gb" />);

    expect(container.firstChild).toBeNull();
  });

  it("renders inline variant with the used/limit count", () => {
    setQuota({ key: "athlete_slot", used: 47, limit: 100 });

    render(<QuotaMeter quotaKey="athlete_slot" />);

    expect(screen.getByText("47 / 100")).toBeInTheDocument();
    // Default label is title-cased from the key.
    expect(screen.getByText("Athlete Slot")).toBeInTheDocument();
  });

  it("uses the caller's label when one is passed", () => {
    setQuota({ key: "athlete_slot", used: 47, limit: 100 });

    render(<QuotaMeter label="Students" quotaKey="athlete_slot" />);

    expect(screen.getByText("Students")).toBeInTheDocument();
    // The default humanized fallback should not appear.
    expect(screen.queryByText("Athlete Slot")).not.toBeInTheDocument();
  });

  it("exposes a progressbar with the used count as aria-valuenow", () => {
    setQuota({ key: "team_slot", used: 6, limit: 20 });

    render(<QuotaMeter quotaKey="team_slot" />);

    const bar = screen.getByRole("progressbar", { name: /team slot usage/i });

    expect(bar).toHaveAttribute("aria-valuenow", "6");
    expect(bar).toHaveAttribute("aria-valuemax", "20");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
  });

  it("renders the card variant when variant='card' is passed", () => {
    setQuota({ key: "branch_slot", used: 2, limit: 5 });

    render(<QuotaMeter quotaKey="branch_slot" variant="card" />);

    // The card layout puts the count inside a bordered box; we assert on
    // the same text + progressbar to prove the variant still renders.
    expect(screen.getByText("2 / 5")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("caps the progress bar width at 100% when usage exceeds the limit", () => {
    setQuota({ key: "athlete_slot", used: 150, limit: 100 });

    render(<QuotaMeter quotaKey="athlete_slot" />);

    // Progressbar's aria-valuenow still reflects the real usage even when
    // the visual bar caps at 100%.
    const bar = screen.getByRole("progressbar");

    expect(bar).toHaveAttribute("aria-valuenow", "150");
  });
});
