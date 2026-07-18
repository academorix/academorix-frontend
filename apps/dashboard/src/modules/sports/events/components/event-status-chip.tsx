/**
 * @file event-status-chip.tsx
 * @module modules/sports/events/components/event-status-chip
 *
 * @description
 * Color-coded chip for an {@link EventStatus}, reused by the events list and
 * detail screens.
 */

import { Chip } from "@stackra/ui/react";

import type { EventStatus } from "@/types";
import type { ReactNode } from "react";

import { EVENT_STATUS_LABELS } from "@/types";

/** Maps each event status to a semantic HeroUI Chip color. */
const COLOR: Record<EventStatus, "success" | "warning" | "danger" | "default"> = {
  draft: "default",
  scheduled: "warning",
  in_progress: "success",
  completed: "default",
  cancelled: "danger",
};

/** A soft, color-coded chip for an event's status. */
export function EventStatusChip({ status }: { status: EventStatus }): ReactNode {
  return (
    <Chip color={COLOR[status]} size="sm" variant="soft">
      {EVENT_STATUS_LABELS[status]}
    </Chip>
  );
}
