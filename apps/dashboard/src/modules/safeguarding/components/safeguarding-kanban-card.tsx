/**
 * @file safeguarding-kanban-card.tsx
 * @module modules/safeguarding/components/safeguarding-kanban-card
 *
 * @description
 * Body of a safeguarding-case card rendered inside the shared Kanban board —
 * the shared board owns the draggable/focusable shell; this module-local
 * component renders the *inside*: case reference, category, subject athlete,
 * handler, opened-at date, and a days-open counter.
 *
 * Kept in `modules/safeguarding/components` because the layout is
 * safeguarding-specific — leads cards render a different body.
 */

import { Chip } from "@academorix/ui/react";

import type { SafeguardingCase } from "@/modules/safeguarding/safeguarding.types";
import type { ReactNode } from "react";

import { formatDate } from "@/lib/format";
import { SafeguardingSeverityChip } from "@/modules/safeguarding/components/safeguarding-chips";

/**
 * Returns the number of days between the case's `opened_at` timestamp and
 * "now", or `null` when the timestamp is missing/invalid/in-the-future.
 */
export function daysOpen(openedAtIso: string | null | undefined): number | null {
  if (!openedAtIso) {
    return null;
  }

  const opened = new Date(openedAtIso).getTime();

  if (Number.isNaN(opened)) {
    return null;
  }

  const now = Date.now();

  if (opened > now) {
    return null;
  }

  return Math.floor((now - opened) / (1000 * 60 * 60 * 24));
}

/**
 * Compact label for a "days open" counter, mirroring the leads card age chip.
 * Kept out of the component so a test can verify the string edge cases
 * without wading through DOM.
 */
export function formatDaysOpen(days: number): string {
  if (days === 0) {
    return "Opened today";
  }

  if (days === 1) {
    return "1 day open";
  }

  return `${days} days open`;
}

/**
 * Builds a short case reference from a UUID id, so the card header stays
 * readable. Falls back to the whole id when it's too short to slice.
 */
export function caseRef(id: string): string {
  return id.length > 8 ? id.slice(0, 8).toUpperCase() : id.toUpperCase();
}

/** Props for {@link SafeguardingKanbanCardBody}. */
export interface SafeguardingKanbanCardBodyProps {
  /** The case record to render. */
  case_: SafeguardingCase;
  /**
   * Subject athlete display name (or "General concern" when
   * `case_.athlete_id` is `null`).
   */
  subject: string;
  /** Handler display name, or `null` when unassigned. */
  handlerName: string | null;
}

/**
 * Safeguarding case card body — subject headline, category + severity chips,
 * handler / opened / days-open footer.
 */
export function SafeguardingKanbanCardBody({
  case_,
  subject,
  handlerName,
}: SafeguardingKanbanCardBodyProps): ReactNode {
  const days = daysOpen(case_.opened_at);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground">{subject}</span>
          <span className="text-xs text-muted">
            {caseRef(case_.id)} · {case_.category}
          </span>
        </div>
        <SafeguardingSeverityChip severity={case_.severity} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip size="sm" variant="secondary">
          <Chip.Label>{handlerName ?? "Unassigned"}</Chip.Label>
        </Chip>
        <Chip size="sm" variant="soft">
          <Chip.Label>Opened {formatDate(case_.opened_at)}</Chip.Label>
        </Chip>
        {days !== null ? (
          <Chip color={days > 30 ? "warning" : "default"} size="sm" variant="soft">
            <Chip.Label>{formatDaysOpen(days)}</Chip.Label>
          </Chip>
        ) : null}
      </div>
    </div>
  );
}
