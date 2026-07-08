/**
 * @file attendance.types.ts
 * @module modules/sports/attendance/attendance.types
 *
 * @description
 * Attendance-module-local type shapes. Wraps the shared domain types from
 * `@/types` with names that match the agenda screen's vocabulary and adds a
 * small filter object used by the calendar filter chips.
 *
 * We prefer thin aliases (`AttendanceMarker = Attendance`) over duplication so
 * the agenda page reads naturally without introducing a parallel type
 * hierarchy.
 */

import type { Attendance, AttendanceStatus, Event, EventStatus } from "@/types";

/**
 * A calendar-friendly alias for the domain {@link Event}. The attendance
 * agenda calls its calendar cells "sessions" (that's the coach-facing term),
 * while the backend serialises them under the `events` resource with
 * `type: "training" | "match" | "session" | ...`. The alias keeps both
 * vocabularies straight without a duplicate declaration.
 *
 * @see modules/sports/attendance/pages/agenda.tsx
 */
export type Session = Event;

/**
 * A single attendance mark. Renamed for the agenda's drawer roster so the
 * naming lines up with the coach-facing screen ("markers" vs the internal
 * "attendance record").
 */
export type AttendanceMarker = Attendance;

/**
 * The four filter axes the agenda toolbar exposes: team, coach, branch, and
 * session status. `null` means "no filter for this axis" — matches the
 * `filterChips` semantics of the shared listing pattern.
 */
export interface AttendanceAgendaFilters {
  /** Team id filter; matches the `team_id` field on the session. */
  teamId: string | null;
  /**
   * Coach id filter. Not stored directly on the `Event` shape, so this is
   * evaluated client-side against the coach id resolved via the training
   * session relationship (dropped when the coach cannot be resolved).
   */
  coachId: string | null;
  /**
   * Branch id filter. In practice the working scope already scopes the query
   * to a single branch — this filter kicks in when the user opts to see all
   * branches or overrides the scope.
   */
  branchId: string | null;
  /** Session status: `planned`, `completed`, `cancelled`, etc. */
  status: EventStatus | null;
}

/** The empty (unfiltered) baseline for {@link AttendanceAgendaFilters}. */
export const EMPTY_ATTENDANCE_FILTERS: AttendanceAgendaFilters = {
  teamId: null,
  coachId: null,
  branchId: null,
  status: null,
};

/**
 * Result of `hasAttendanceBeenTaken(session, markers)` — three possible
 * outcomes shown to the coach as event color:
 *
 *   - `"none"`      → no markers exist for this session — needs attention.
 *   - `"partial"`   → some markers exist but not for everyone (indicator).
 *   - `"complete"`  → every expected marker is present — coach can move on.
 *
 * The agenda page maps each outcome to a color key that the calendar renders.
 */
export type AttendanceCoverage = "none" | "partial" | "complete";

/**
 * Whether attendance has been taken for `session`. Counts markers scoped to
 * the session id — coverage is calibrated per-session so a partially-filled
 * roster still nudges the coach without being marked complete.
 *
 * Kept as a plain function so the caller can memoise the map once per markers
 * refetch rather than recomputing on every render.
 *
 * @param sessionId - The session's id.
 * @param markers - Every attendance marker in the visible window.
 * @param expected - Expected roster size when known; otherwise the function
 *  only distinguishes `"none"` vs `"complete"` (there is no way to know
 *  "partial" without the roster count).
 */
export function computeAttendanceCoverage(
  sessionId: string,
  markers: AttendanceMarker[],
  expected: number | null = null,
): AttendanceCoverage {
  const relevant = markers.filter((marker) => marker.event_id === sessionId);

  if (relevant.length === 0) {
    return "none";
  }

  if (expected !== null && expected > 0 && relevant.length < expected) {
    return "partial";
  }

  return "complete";
}

/**
 * The four attendance statuses expressed as label + count — used to render
 * a small badge inside the roster drawer. Not exported for consumers outside
 * the agenda for now.
 */
export interface AttendanceStatusCount {
  status: AttendanceStatus;
  count: number;
}
