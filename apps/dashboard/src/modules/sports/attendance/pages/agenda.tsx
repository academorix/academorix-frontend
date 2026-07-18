/**
 * @file agenda.tsx
 * @module modules/sports/attendance/pages/agenda
 *
 * @description
 * The attendance agenda / calendar view. Renders one calendar event per
 * scheduled session in the visible window, colored by whether attendance has
 * been captured. Clicking a session opens the roster drawer so the coach can
 * review or tweak individual markers.
 *
 * # Feature-flag behaviour
 *
 * When `features.attendanceAgenda` is off, this page redirects to the classic
 * attendance list at `/attendance`. That keeps the route registered without
 * making it reachable, so link-in-app QA can still target it while the flag
 * is off.
 *
 * # Data flow
 *
 * The page owns two lists:
 *
 *   1. `sessions` — from `events`, filtered to the visible week window
 *      (`starts_at >= weekStart AND starts_at <= weekEnd`).
 *   2. `markers` — from `attendance`, unpaginated, then filtered to the
 *      session ids we just fetched. Skipping the server-side session-id
 *      filter keeps the wire payload flat (one extra endpoint call vs 20).
 *
 * # Timezone
 *
 * The sessions' `starts_at` / `ends_at` are ISO 8601 UTC. The calendar view
 * components parse them with `new Date(iso)` (offset-aware) and render in
 * local time. When we send the window bounds back to the server, we use
 * `Date.prototype.toISOString()` so the wire payload stays UTC.
 *
 * # Filter chips
 *
 * Four filter axes (team / coach / branch / status) render as dismissable
 * chips above the calendar. The scope-based branch filter is honoured by the
 * server (via the resource's `scopedBy` meta); the per-axis chip filters run
 * client-side because they combine post-fetch.
 */

import { PlusIcon, XMarkIcon } from "@stackra/ui/icons/heroicon/outline";
import { Button, Chip, Label, ListBox, Select, Tooltip } from "@stackra/ui/react";
import { useList } from "@refinedev/core";
import { useCallback, useMemo, useState } from "react";
import { Navigate, useNavigate } from "@stackra/routing/react";

import type { CalendarEvent, CalendarEventColorKey } from "@/components/calendar";
import type {
  AttendanceAgendaFilters,
  AttendanceCoverage,
  AttendanceMarker,
  Session,
} from "@/modules/sports/attendance/attendance.types";
import type { Branch, EventStatus, Staff, Team } from "@/types";
import type { Key, ReactNode } from "react";

import {
  addDays,
  CalendarDay,
  CalendarMonth,
  CalendarToolbar,
  CalendarWeek,
  startOfMonth,
  startOfWeek,
  useCalendarNavigation,
} from "@/components/calendar";
import { ListView } from "@/components/refine";
import { features } from "@/config/features.config";
import {
  computeAttendanceCoverage,
  EMPTY_ATTENDANCE_FILTERS,
} from "@/modules/sports/attendance/attendance.types";
import { AttendanceRosterDrawer } from "@/modules/sports/attendance/components/attendance-roster-drawer";
import { EVENT_STATUS_LABELS, EVENT_STATUSES } from "@/types";

/**
 * Maps a coverage state to a calendar color key. The two-way mapping keeps
 * the visual language declarative — `"complete"` gets green, `"partial"` gets
 * amber, `"none"` gets red so an empty roster is obvious at a glance.
 */
const COVERAGE_COLOR: Record<AttendanceCoverage, CalendarEventColorKey> = {
  none: "danger",
  partial: "warning",
  complete: "success",
};

/**
 * Sentinel value for "any" in a dropdown. HeroUI `Select` requires a string
 * `id` per option, so we can't pass `null` directly. We convert on both sides.
 */
const ANY_VALUE = "__any__";

/**
 * Turns the current view + anchor into an inclusive `[start, end]` window,
 * anchored at 00:00 local time. The window bounds are what the server sees;
 * the calendar itself only reads events that fall inside its own view.
 */
function windowFor(view: "day" | "week" | "month", anchor: Date): { start: Date; end: Date } {
  if (view === "day") {
    const start = new Date(anchor);

    start.setHours(0, 0, 0, 0);

    const end = new Date(start);

    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  if (view === "month") {
    // Cover the whole month plus the leading/trailing days of the visible grid,
    // so the month view doesn't show empty cells where sessions live.
    const monthStart = startOfMonth(anchor);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = addDays(gridStart, 6 * 7);

    gridEnd.setHours(23, 59, 59, 999);

    return { start: gridStart, end: gridEnd };
  }

  // Week view — Mon..Sun.
  const weekStart = startOfWeek(anchor);
  const weekEnd = addDays(weekStart, 6);

  weekEnd.setHours(23, 59, 59, 999);

  return { start: weekStart, end: weekEnd };
}

/**
 * Attendance agenda page.
 */
export default function AttendanceAgendaPage(): ReactNode {
  // Feature flag check — when off, the page redirects to the classic list.
  // `replace` on the Navigate so the browser back button skips the redirect.
  if (!features.attendanceAgenda) {
    return <Navigate replace to="/attendance" />;
  }

  return <AttendanceAgendaInner />;
}

/**
 * The real agenda implementation, hidden behind the feature-flag guard so
 * the hooks don't run when the page is a passthrough.
 */
function AttendanceAgendaInner(): ReactNode {
  const navigate = useNavigate();
  const nav = useCalendarNavigation({ initialView: "week" });
  const { currentDate, view } = nav;

  const [filters, setFilters] = useState<AttendanceAgendaFilters>(EMPTY_ATTENDANCE_FILTERS);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Compute the visible window from the active view + anchor. The window
  // widens for the month view so multi-week grids don't show empty cells.
  const { start: windowStart, end: windowEnd } = useMemo(
    () => windowFor(view, currentDate),
    [view, currentDate],
  );

  // Sessions — fetched from the `events` resource with a date-range filter.
  // The `scopedBy: ["branch"]` on the attendance resource means Refine will
  // automatically append the active branch to the query; we don't have to.
  const { result: sessionsResult, query: sessionsQuery } = useList<Session>({
    resource: "events",
    pagination: { mode: "off" },
    filters: [
      { field: "starts_at", operator: "gte", value: windowStart.toISOString() },
      { field: "starts_at", operator: "lte", value: windowEnd.toISOString() },
    ],
    sorters: [{ field: "starts_at", order: "asc" }],
  });

  // Wrap the `data ?? []` fallbacks in `useMemo` so downstream memos don't
  // treat the sessions array as a new reference on every render.
  const sessions = useMemo(() => sessionsResult?.data ?? [], [sessionsResult?.data]);

  // Attendance markers — fetched unpaginated over the same window. In the
  // current backend the resource is `attendance`, not `attendance-markers`;
  // the module owns the type alias `AttendanceMarker = Attendance` so the
  // vocabulary matches the coach-facing surface.
  const { result: markersResult, query: markersQuery } = useList<AttendanceMarker>({
    resource: "attendance",
    pagination: { mode: "off" },
    queryOptions: { enabled: sessions.length > 0 },
  });

  const markers = useMemo(() => markersResult?.data ?? [], [markersResult?.data]);

  // Filter option lookups — teams / staff / branches all fetched once with
  // pagination off. Matches the pattern used by the sessions list.
  const { result: teamsResult } = useList<Team>({
    resource: "teams",
    pagination: { mode: "off" },
  });
  const { result: staffResult } = useList<Staff>({
    resource: "staff",
    pagination: { mode: "off" },
  });
  const { result: branchesResult } = useList<Branch>({
    resource: "branches",
    pagination: { mode: "off" },
  });

  const teams = useMemo(() => teamsResult?.data ?? [], [teamsResult?.data]);
  const staff = useMemo(() => staffResult?.data ?? [], [staffResult?.data]);
  const branches = useMemo(() => branchesResult?.data ?? [], [branchesResult?.data]);

  // Resolve team → coach id so the coach filter can match sessions via the
  // team's `lead_coach_id` (Session/Event doesn't carry a coach id directly).
  const teamCoach = useMemo(() => {
    const map = new Map<string, string | null>();

    for (const team of teams) {
      map.set(team.id, team.lead_coach_id);
    }

    return map;
  }, [teams]);

  // Apply the client-side filter axes: team, coach (via team lookup), branch,
  // status. Filters compose so the calendar only surfaces the intersection.
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (filters.teamId && session.team_id !== filters.teamId) {
        return false;
      }

      if (filters.branchId && session.branch_id !== filters.branchId) {
        return false;
      }

      if (filters.status && session.status !== filters.status) {
        return false;
      }

      if (filters.coachId) {
        // Coach filter matches when the session's team is led by the coach.
        // Sessions without a team drop out of the filtered set.
        const teamId = session.team_id;

        if (!teamId) {
          return false;
        }

        const leadCoach = teamCoach.get(teamId);

        if (leadCoach !== filters.coachId) {
          return false;
        }
      }

      return true;
    });
  }, [sessions, filters, teamCoach]);

  // Map sessions → calendar events. Coverage is computed per-session with the
  // markers we just fetched; the expected size hint is the team's
  // `members_count` when available, so a partial roster surfaces the amber
  // "partial" color rather than jumping straight to green.
  const events = useMemo<CalendarEvent<Session>[]>(() => {
    const teamSize = new Map<string, number>();

    for (const team of teams) {
      teamSize.set(team.id, team.members_count);
    }

    return filteredSessions.map((session) => {
      const expected = session.team_id ? (teamSize.get(session.team_id) ?? null) : null;
      const coverage = computeAttendanceCoverage(session.id, markers, expected);

      return {
        id: session.id,
        title: session.title,
        startAt: session.starts_at,
        endAt: session.ends_at,
        status: session.status,
        // Cancelled sessions get a strikethrough regardless of coverage — the
        // calendar view components handle the visual override.
        colorKey: session.status === "cancelled" ? "neutral" : COVERAGE_COLOR[coverage],
        meta: session,
      };
    });
  }, [filteredSessions, markers, teams]);

  const handleEventClick = useCallback((event: CalendarEvent<Session>) => {
    if (event.meta) {
      setSelectedSession(event.meta);
      setIsDrawerOpen(true);
    }
  }, []);

  // Filter chips shown above the calendar. Each chip clears its own axis.
  const filterChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onClear: () => void }> = [];

    if (filters.teamId) {
      const team = teams.find((candidate) => candidate.id === filters.teamId);

      chips.push({
        id: `team:${filters.teamId}`,
        label: `Team: ${team?.name ?? filters.teamId}`,
        onClear: () => setFilters((prev) => ({ ...prev, teamId: null })),
      });
    }

    if (filters.coachId) {
      const coach = staff.find((candidate) => candidate.id === filters.coachId);

      chips.push({
        id: `coach:${filters.coachId}`,
        label: `Coach: ${coach ? `${coach.first_name} ${coach.last_name}` : filters.coachId}`,
        onClear: () => setFilters((prev) => ({ ...prev, coachId: null })),
      });
    }

    if (filters.branchId) {
      const branch = branches.find((candidate) => candidate.id === filters.branchId);

      chips.push({
        id: `branch:${filters.branchId}`,
        label: `Branch: ${branch?.name ?? filters.branchId}`,
        onClear: () => setFilters((prev) => ({ ...prev, branchId: null })),
      });
    }

    if (filters.status) {
      chips.push({
        id: `status:${filters.status}`,
        label: `Status: ${EVENT_STATUS_LABELS[filters.status]}`,
        onClear: () => setFilters((prev) => ({ ...prev, status: null })),
      });
    }

    return chips;
  }, [filters, teams, staff, branches]);

  const clearAllFilters = useCallback(() => {
    setFilters(EMPTY_ATTENDANCE_FILTERS);
  }, []);

  const isLoading = sessionsQuery.isLoading || markersQuery.isLoading;

  return (
    <ListView headerActions={null} resource="attendance" title="Attendance agenda">
      <div className="flex flex-col gap-4" data-testid="attendance-agenda">
        {/* Filter dropdowns — same look-and-feel as `facilities/pages/list.tsx`,
            kept as native inputs so the toolbar height stays predictable. */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
          <FilterSelect
            ariaLabel="Filter by team"
            emptyLabel="All teams"
            options={teams.map((team) => ({ id: team.id, label: team.name }))}
            value={filters.teamId}
            onChange={(value) => setFilters((prev) => ({ ...prev, teamId: value }))}
          />
          <FilterSelect
            ariaLabel="Filter by coach"
            emptyLabel="All coaches"
            options={staff.map((coach) => ({
              id: coach.id,
              label: `${coach.first_name} ${coach.last_name}`,
            }))}
            value={filters.coachId}
            onChange={(value) => setFilters((prev) => ({ ...prev, coachId: value }))}
          />
          <FilterSelect
            ariaLabel="Filter by branch"
            emptyLabel="All branches"
            options={branches.map((branch) => ({ id: branch.id, label: branch.name }))}
            value={filters.branchId}
            onChange={(value) => setFilters((prev) => ({ ...prev, branchId: value }))}
          />
          <FilterSelect
            ariaLabel="Filter by status"
            emptyLabel="Any status"
            options={EVENT_STATUSES.map((status) => ({
              id: status,
              label: EVENT_STATUS_LABELS[status],
            }))}
            value={filters.status}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                // The dropdown ids match the EventStatus union; casting is
                // safe because the option list is derived from that union.
                status: value === null ? null : (value as EventStatus),
              }))
            }
          />
        </div>

        {/* Active filter chips — dismissable per-axis. Matches the design of
            `facilities/pages/list.tsx`. */}
        {filterChips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {filterChips.map((chip) => (
              <Chip key={chip.id} size="sm" variant="secondary">
                <Chip.Label>{chip.label}</Chip.Label>
                <Tooltip>
                  <button
                    aria-label={`Clear filter: ${chip.label}`}
                    className="text-muted hover:text-foreground"
                    type="button"
                    onClick={chip.onClear}
                  >
                    <XMarkIcon aria-hidden="true" className="size-3" />
                  </button>
                  <Tooltip.Content>Clear filter</Tooltip.Content>
                </Tooltip>
              </Chip>
            ))}
            <Button size="sm" variant="ghost" onPress={clearAllFilters}>
              Clear all
            </Button>
          </div>
        ) : null}

        {/* Toolbar (prev/today/next + view switcher + primary CTA). */}
        <CalendarToolbar
          ariaLabel="Attendance agenda"
          currentDate={currentDate}
          trailingAction={
            <Button
              aria-label="New session"
              size="sm"
              variant="primary"
              onPress={() => {
                // The agenda page doesn't own session creation — it hands off
                // to the classic `events` create route so the flow stays
                // consistent with the coach's day-to-day.
                navigate("/events/create");
              }}
            >
              <PlusIcon aria-hidden="true" className="mr-1 size-4" />
              New session
            </Button>
          }
          view={view}
          onNext={nav.goToNext}
          onPrev={nav.goToPrev}
          onToday={nav.goToToday}
          onViewChange={nav.setView}
        />

        {/* Loading state — replaces the calendar body while the first
            sessions call is in-flight so the empty grid doesn't flash. */}
        {isLoading && events.length === 0 ? (
          <div
            className="flex h-64 items-center justify-center rounded-lg border border-border bg-surface"
            data-testid="attendance-agenda-loading"
          >
            <span className="text-sm text-muted">Loading sessions…</span>
          </div>
        ) : null}

        {/* The three view components share the same event shape — we render
            whichever one the toolbar selected. */}
        {view === "week" ? (
          <CalendarWeek<Session>
            ariaLabel="Attendance week calendar"
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
          />
        ) : null}

        {view === "day" ? (
          <CalendarDay<Session>
            ariaLabel="Attendance day agenda"
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
          />
        ) : null}

        {view === "month" ? (
          <CalendarMonth<Session>
            ariaLabel="Attendance month calendar"
            currentDate={currentDate}
            events={events}
            onEventClick={handleEventClick}
            onSlotClick={(date) => {
              // Clicking "+N more" on the month view drops back to the day
              // view for the selected date so the coach can see every event.
              nav.goToDate(date);
              nav.setView("day");
            }}
          />
        ) : null}
      </div>

      {/* Roster drawer — controlled by the selected session state. */}
      <AttendanceRosterDrawer
        isOpen={isDrawerOpen}
        markers={markers}
        session={selectedSession}
        onOpenChange={(next) => {
          setIsDrawerOpen(next);
          if (!next) {
            // Clear the session only after the drawer closes so the exit
            // animation still has the session's title to render against.
            setTimeout(() => setSelectedSession(null), 200);
          }
        }}
      />
    </ListView>
  );
}

/** Props for the small compact filter select used above the agenda. */
interface FilterSelectProps {
  ariaLabel: string;
  emptyLabel: string;
  options: Array<{ id: string; label: string }>;
  value: string | null;
  onChange: (value: string | null) => void;
}

/**
 * A tiny wrapper over HeroUI's `Select` primitive that binds the standard
 * "no filter" sentinel to `null`. Kept local because it's used four times in
 * this file and nowhere else.
 */
function FilterSelect({
  ariaLabel,
  emptyLabel,
  options,
  value,
  onChange,
}: FilterSelectProps): ReactNode {
  return (
    <Select
      aria-label={ariaLabel}
      className="min-w-[180px]"
      value={value ?? ANY_VALUE}
      variant="secondary"
      onChange={(key: Key | null) => {
        if (key === null || key === ANY_VALUE) {
          onChange(null);

          return;
        }

        onChange(String(key));
      }}
    >
      <Label className="sr-only">{ariaLabel}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item key={ANY_VALUE} id={ANY_VALUE} textValue={emptyLabel}>
            {emptyLabel}
            <ListBox.ItemIndicator />
          </ListBox.Item>
          {options.map((option) => (
            <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
