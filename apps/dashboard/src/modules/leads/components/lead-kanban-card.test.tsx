/**
 * @file lead-kanban-card.test.tsx
 * @module modules/leads/components/lead-kanban-card.test
 *
 * @description
 * Unit tests for the leads kanban card body helpers + the visual body.
 *
 * The helpers ({@link ageInDays}, {@link formatAgeLabel}) are pure functions
 * with clear edge cases (today, single day, plural, invalid input, future
 * date) so they're covered independently from the DOM render.
 *
 * The body component renders three pieces of info: name, source+sport, and
 * a footer with owner + age chips. We assert each piece survives the render
 * so a regression in the layout (accidentally dropping the source, e.g.)
 * catches locally instead of during a manual pass on the kanban.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Lead } from "@/modules/leads/leads.types";

import {
  ageInDays,
  formatAgeLabel,
  LeadKanbanCardBody,
} from "@/modules/leads/components/lead-kanban-card";

/** Builds a minimal lead record for tests. */
function makeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tenant_id: "tenant-1",
    organization_id: "org-1",
    branch_id: "branch-1",
    name: "Jordan Reyes",
    contact_email: null,
    contact_phone: null,
    sport_key: "football",
    stage: "qualified",
    source: "web",
    owner_id: "staff-1",
    note: null,
    ...overrides,
  };
}

describe("ageInDays", () => {
  it("returns the whole-day count for a past ISO timestamp", () => {
    // Freeze `Date.now()` so the test isn't sensitive to when it runs.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-11T00:00:00Z"));

    try {
      expect(ageInDays("2024-01-01T00:00:00Z")).toBe(10);
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns null for an invalid ISO string", () => {
    expect(ageInDays("not-a-date")).toBeNull();
  });

  it("returns null for a future ISO timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    try {
      expect(ageInDays("2025-01-01T00:00:00Z")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("formatAgeLabel", () => {
  it("returns 'New today' for a zero-day age", () => {
    expect(formatAgeLabel(0)).toBe("New today");
  });

  it("returns '1 day old' for a one-day age", () => {
    expect(formatAgeLabel(1)).toBe("1 day old");
  });

  it("returns 'N days old' for a plural age", () => {
    expect(formatAgeLabel(7)).toBe("7 days old");
  });
});

describe("LeadKanbanCardBody", () => {
  it("renders name, source, sport, owner name, and age chip", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-06T00:00:00Z"));

    try {
      render(
        <LeadKanbanCardBody
          lead={makeLead({
            created_at: "2024-01-01T00:00:00Z",
            source: "walk_in",
            sport_key: "basketball",
          })}
          ownerName="Alice Ng"
        />,
      );

      expect(screen.getByText("Jordan Reyes")).toBeInTheDocument();
      expect(screen.getByText("walk_in · basketball")).toBeInTheDocument();
      expect(screen.getByText("Alice Ng")).toBeInTheDocument();
      expect(screen.getByText("5 days old")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders 'Unassigned' when no owner is passed", () => {
    render(<LeadKanbanCardBody lead={makeLead()} ownerName={null} />);

    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("hides the sport separator when the lead has no sport", () => {
    render(<LeadKanbanCardBody lead={makeLead({ sport_key: null })} ownerName={null} />);

    // No " · " separator when sport is absent.
    expect(screen.getByText("web")).toBeInTheDocument();
    expect(screen.queryByText("web · null")).not.toBeInTheDocument();
  });
});
