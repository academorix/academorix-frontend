/**
 * @file safeguarding-kanban-card.test.tsx
 * @module modules/safeguarding/components/safeguarding-kanban-card.test
 *
 * @description
 * Unit tests for the safeguarding kanban card body helpers + the visual body.
 *
 * The helpers ({@link daysOpen}, {@link formatDaysOpen}, {@link caseRef}) are
 * pure functions with clear edge cases (today, single day, plural, invalid
 * input, future date, short id) so they're covered independently from the
 * DOM render.
 *
 * The body component renders four pieces of info: subject, case ref +
 * category, severity chip, and a footer with handler + opened + days-open
 * chips. We assert each piece survives the render so a regression catches
 * locally instead of during a manual pass on the kanban.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { SafeguardingCase } from "@/modules/safeguarding/safeguarding.types";

import {
  caseRef,
  daysOpen,
  formatDaysOpen,
  SafeguardingKanbanCardBody,
} from "@/modules/safeguarding/components/safeguarding-kanban-card";

/** Builds a minimal safeguarding case for tests. */
function makeCase(overrides: Partial<SafeguardingCase> = {}): SafeguardingCase {
  return {
    id: "abc12345-def6-7890-1234-567890abcdef",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tenant_id: "tenant-1",
    organization_id: "org-1",
    branch_id: "branch-1",
    athlete_id: null,
    category: "welfare",
    severity: "medium",
    status: "open",
    summary: "Concern raised at parent meeting",
    handler_id: null,
    opened_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("daysOpen", () => {
  it("returns the whole-day count for a past ISO timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-06T00:00:00Z"));

    try {
      expect(daysOpen("2024-01-01T00:00:00Z")).toBe(5);
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns null when the timestamp is missing", () => {
    expect(daysOpen(null)).toBeNull();
    expect(daysOpen(undefined)).toBeNull();
  });

  it("returns null for an invalid or future timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    try {
      expect(daysOpen("not-a-date")).toBeNull();
      expect(daysOpen("2030-01-01T00:00:00Z")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("formatDaysOpen", () => {
  it("returns 'Opened today' for a zero-day age", () => {
    expect(formatDaysOpen(0)).toBe("Opened today");
  });

  it("returns '1 day open' for a one-day age", () => {
    expect(formatDaysOpen(1)).toBe("1 day open");
  });

  it("returns 'N days open' for a plural age", () => {
    expect(formatDaysOpen(14)).toBe("14 days open");
  });
});

describe("caseRef", () => {
  it("returns the first eight characters uppercased for a long id", () => {
    expect(caseRef("abc12345-def6-7890-1234-567890abcdef")).toBe("ABC12345");
  });

  it("returns the whole id uppercased for a short id", () => {
    expect(caseRef("short")).toBe("SHORT");
  });
});

describe("SafeguardingKanbanCardBody", () => {
  it("renders subject, case ref, category, severity, handler, opened, and days open", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-11T00:00:00Z"));

    try {
      render(
        <SafeguardingKanbanCardBody
          case_={makeCase({
            category: "conduct",
            severity: "high",
            opened_at: "2024-01-01T00:00:00Z",
          })}
          handlerName="Dr. Ade"
          subject="Casey Johnson"
        />,
      );

      expect(screen.getByText("Casey Johnson")).toBeInTheDocument();
      // Case ref + category share one line, separated by " · ".
      expect(screen.getByText(/ABC12345/)).toBeInTheDocument();
      expect(screen.getByText(/conduct/)).toBeInTheDocument();
      // Severity chip renders the label from SAFEGUARDING_SEVERITY_LABELS.
      expect(screen.getByText("High")).toBeInTheDocument();
      expect(screen.getByText("Dr. Ade")).toBeInTheDocument();
      expect(screen.getByText("10 days open")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders 'Unassigned' when the handler is null", () => {
    render(<SafeguardingKanbanCardBody case_={makeCase()} handlerName={null} subject="General" />);

    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });
});
