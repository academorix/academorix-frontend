/**
 * @file upcoming-sessions.tsx
 * @module components/dashboard/upcoming-sessions
 *
 * @description
 * The "Today's schedule" widget (Section 4.1 step 5, simplified to a list
 * view). Renders a compact roster of upcoming sessions with attendance
 * progress and a click-through to the session detail page.
 */

import { Card, Chip, ProgressBar } from "@heroui/react";
import { useNavigate } from "@stackra/routing/react";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Iconify } from "@/icons/iconify";

export function UpcomingSessions() {
  const navigate = useNavigate();
  const { data } = useDashboardData();
  const upcomingSessions = data?.upcomingSessions ?? [];

  return (
    <Card className="h-full">
      <Card.Header>
        <Card.Title className="text-base">Today&apos;s schedule</Card.Title>
        <Card.Description className="text-sm text-muted">
          Sessions, matches, and events on the roster today.
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-3">
        {upcomingSessions.map((session) => {
          const fill = session.capacity === 0 ? 0 : (session.attendees / session.capacity) * 100;

          return (
            <button
              key={session.id}
              className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-surface-secondary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              onClick={() => navigate("/training-sessions")}
              type="button"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-muted">
                <Iconify className="size-4" icon="clock" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{session.title}</p>
                  <span className="shrink-0 text-xs whitespace-nowrap text-muted">
                    {session.time}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {session.coach} · {session.location}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <ProgressBar
                    aria-label={`${session.attendees} of ${session.capacity} attending`}
                    className="flex-1"
                    value={fill}
                  >
                    <ProgressBar.Track>
                      <ProgressBar.Fill />
                    </ProgressBar.Track>
                  </ProgressBar>
                  <span className="text-[11px] text-muted tabular-nums">
                    {session.attendees}/{session.capacity}
                  </span>
                  <Chip size="sm" variant="soft">
                    <Chip.Label>{session.discipline}</Chip.Label>
                  </Chip>
                </div>
              </div>
            </button>
          );
        })}
      </Card.Content>
    </Card>
  );
}
