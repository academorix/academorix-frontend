/**
 * @file attendance-roster-drawer.tsx
 * @module modules/sports/attendance/components/attendance-roster-drawer
 *
 * @description
 * The drawer that opens when a coach clicks a session on the attendance
 * agenda. Renders the session's roster — one row per athlete — with an
 * inline attendance status control (reusing {@link AttendanceStatusCell}).
 *
 * ## Data flow
 *
 * The drawer takes an already-resolved `session` from the parent, plus the
 * markers scoped to *that* session (filtered client-side from the visible
 * window's marker list). It does not re-fetch anything — the parent already
 * paid for the network roundtrip and holds the source of truth.
 *
 * Attendance edits go through the existing {@link AttendanceStatusCell}
 * which wires `useUpdate` directly against the `attendance` resource. That
 * means bulk verbs (mark-all-present) intentionally stay out of scope: this
 * is the "click a session to review + tweak" surface, not the "mark 20
 * athletes at once" surface.
 */

import { UserGroupIcon } from "@academorix/ui/icons/outline";
import { Chip, Drawer, Spinner } from "@academorix/ui/react";
import { useList } from "@refinedev/core";
import { useMemo } from "react";

import type { AttendanceMarker, Session } from "@/modules/sports/attendance/attendance.types";
import type { Athlete } from "@/types";
import type { ReactNode } from "react";

import { formatDateTime } from "@/lib/format";
import { AttendanceStatusCell } from "@/modules/sports/attendance/components/attendance-status-cell";
import { ATTENDANCE_STATUS_LABELS } from "@/types";

/** Props for {@link AttendanceRosterDrawer}. */
export interface AttendanceRosterDrawerProps {
  /** The session whose roster to show. `null` closes the drawer. */
  session: Session | null;
  /** Controlled open flag. */
  isOpen: boolean;
  /** Called by the drawer to close itself. */
  onOpenChange: (isOpen: boolean) => void;
  /**
   * Every attendance marker in the current agenda window. The drawer filters
   * this down to the session's own markers — passing the full list keeps the
   * parent's cache hot and avoids a per-open refetch.
   */
  markers: AttendanceMarker[];
}

/**
 * The roster drawer. See file docstring for the design contract.
 */
export function AttendanceRosterDrawer({
  session,
  isOpen,
  onOpenChange,
  markers,
}: AttendanceRosterDrawerProps): ReactNode {
  // Load every athlete so we can resolve marker `athlete_id` to a display
  // name. The list is small (per-branch, typically < 500 athletes) so an
  // unpaginated fetch is fine, matching the pattern the sessions/list page
  // uses for coach + athlete lookups.
  const { result: athletesResult, query: athletesQuery } = useList<Athlete>({
    resource: "athletes",
    pagination: { mode: "off" },
    queryOptions: { enabled: isOpen && session !== null },
  });

  const athleteName = useMemo(() => {
    const map = new Map<string, string>();

    for (const athlete of athletesResult?.data ?? []) {
      map.set(athlete.id, `${athlete.first_name} ${athlete.last_name}`);
    }

    return map;
  }, [athletesResult?.data]);

  // Filter the input markers down to just this session's roster. Memoised so
  // the drawer body doesn't re-sort on every render of the parent.
  const sessionMarkers = useMemo(() => {
    if (!session) {
      return [];
    }

    const filtered = markers.filter((marker) => marker.event_id === session.id);

    // Sort by athlete display name so the roster reads in a stable order.
    return [...filtered].sort((a, b) => {
      const aName = athleteName.get(a.athlete_id) ?? a.athlete_id;
      const bName = athleteName.get(b.athlete_id) ?? b.athlete_id;

      return aName.localeCompare(bName);
    });
  }, [session, markers, athleteName]);

  // Small status roll-up shown at the top of the drawer (`3 present`, ...).
  const statusCounts = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };

    for (const marker of sessionMarkers) {
      counts[marker.status] += 1;
    }

    return counts;
  }, [sessionMarkers]);

  return (
    // The drawer's outer shell is `<Drawer.Backdrop>` — same pattern used by
    // `notifications/components/notification-drawer.tsx`. Anchoring on the
    // right matches the notification center convention.
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement="right">
        <Drawer.Dialog
          aria-label="Session attendance roster"
          className="flex h-full w-full max-w-md flex-col md:w-[440px]"
          data-testid="attendance-roster-drawer"
        >
          <Drawer.CloseTrigger />
          <Drawer.Header className="flex flex-col gap-1 border-b border-border pb-3">
            <Drawer.Heading>{session?.title ?? "Session attendance"}</Drawer.Heading>
            {session ? (
              <span className="text-xs text-muted">
                {formatDateTime(session.starts_at)} · {session.type}
              </span>
            ) : null}
          </Drawer.Header>

          <div className="flex flex-col gap-3 overflow-y-auto p-4">
            {/* Status summary chips — a compact recap so the coach doesn't
                have to count rows to know where the roster stands. */}
            <div className="flex flex-wrap gap-2">
              <Chip color="success" size="sm" variant="soft">
                <UserGroupIcon aria-hidden="true" className="mr-1 size-3" />
                {statusCounts.present} present
              </Chip>
              <Chip color="danger" size="sm" variant="soft">
                {statusCounts.absent} absent
              </Chip>
              <Chip color="warning" size="sm" variant="soft">
                {statusCounts.late} late
              </Chip>
              <Chip size="sm" variant="soft">
                {statusCounts.excused} excused
              </Chip>
            </div>

            {athletesQuery.isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner aria-label="Loading roster" />
              </div>
            ) : sessionMarkers.length === 0 ? (
              <p className="rounded-md border border-dashed border-border/60 px-3 py-6 text-center text-sm text-muted">
                No attendance markers yet. Marks will appear here once coaches start recording them
                from the classic list view.
              </p>
            ) : (
              <ul
                className="divide-y divide-border rounded-md border border-border"
                data-testid="attendance-roster-list"
              >
                {sessionMarkers.map((marker) => {
                  const name = athleteName.get(marker.athlete_id) ?? marker.athlete_id;

                  return (
                    <li
                      key={marker.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">{name}</span>
                        <span className="text-xs text-muted">
                          {ATTENDANCE_STATUS_LABELS[marker.status]}
                          {marker.note ? ` · ${marker.note}` : ""}
                        </span>
                      </div>
                      <AttendanceStatusCell record={marker} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
