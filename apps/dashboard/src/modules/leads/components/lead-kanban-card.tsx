/**
 * @file lead-kanban-card.tsx
 * @module modules/leads/components/lead-kanban-card
 *
 * @description
 * Body of a lead card rendered inside the shared Kanban board — the
 * {@link "@/components/kanban" KanbanBoard} owns the draggable/focusable shell;
 * this module-local component renders the *inside*: name, source, sport,
 * owner, and the "days since created" age chip.
 *
 * Kept in `modules/leads/components` (not `components/kanban/`) because the
 * layout is lead-specific — safeguarding cards have their own body component.
 */

import { Chip } from "@stackra/ui/react";

import type { Lead } from "@/modules/leads/leads.types";
import type { ReactNode } from "react";

/** Props for {@link LeadKanbanCardBody}. */
export interface LeadKanbanCardBodyProps {
  /** The lead record to render. */
  lead: Lead;
  /** Owner's display name, resolved from the staff list. `null` = unassigned. */
  ownerName: string | null;
}

/**
 * Renders the number of days elapsed since `iso` (a `created_at`). Returns
 * `null` for invalid or future dates so callers can hide the chip entirely.
 */
export function ageInDays(iso: string): number | null {
  const then = new Date(iso).getTime();

  if (Number.isNaN(then)) {
    return null;
  }

  const now = Date.now();

  if (then > now) {
    return null;
  }

  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

/**
 * Formats an age (in days) as a compact human-readable chip label. Kept
 * out of `LeadKanbanCardBody` so tests can exercise the string rules directly.
 */
export function formatAgeLabel(days: number): string {
  if (days === 0) {
    return "New today";
  }

  if (days === 1) {
    return "1 day old";
  }

  return `${days} days old`;
}

/**
 * Lead card body — name headline, source + sport secondary, owner + age
 * footer chips. The shared board draws the outer draggable shell.
 */
export function LeadKanbanCardBody({ lead, ownerName }: LeadKanbanCardBodyProps): ReactNode {
  const days = ageInDays(lead.created_at);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">{lead.name}</span>
        <span className="text-xs text-muted">
          {lead.source}
          {lead.sport_key ? ` · ${lead.sport_key}` : ""}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip size="sm" variant="secondary">
          <Chip.Label>{ownerName ?? "Unassigned"}</Chip.Label>
        </Chip>
        {days !== null ? (
          <Chip size="sm" variant="soft">
            <Chip.Label>{formatAgeLabel(days)}</Chip.Label>
          </Chip>
        ) : null}
      </div>
    </div>
  );
}
