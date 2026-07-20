# tasks

Human-in-loop work queue. Wraps a domain event (a lead needs a follow-up call, a
payment failed and someone should call the parent, a coach didn't submit
attendance) in a Task with an assignee + due date + status. Complements
`workflow/approvals` (formal approve/deny cycles) — tasks are the lightweight
side.

## Owned tables

- `tasks` — the work item. Polymorphic subject (`subject_type` / `subject_id`) →
  Athlete / Order / Payment / Lead. Optional due date + priority.
- `task_assignments` — N-to-N with users. Roles: `assignee` (primary),
  `collaborator` (secondary), `watcher` (notified only).
- `task_comments` — chronological comment thread. `@`-mentions notify the
  mentioned user. Supports file attachments via `platform/storage`.

## Task automation

Per-tenant configurable rules
(`when a lead sits >48h, create a follow-up task for its owner`) authored via
the `TaskAutomationRule` engine + `#[AsTaskAutomation]` attribute on handler
classes. Rules fire on domain events.

## Cross-references

- `growth/leads` — auto-creates follow-up tasks per stage.
- `finance/payment` — creates a task when a charge fails and dunning hits
  step 2.
- `sports/coaching` — staff task queue for coaches.
- `notifications/notifications` — `TaskAssignedNotification`,
  `TaskCommentMentionedNotification`, `TaskDueSoonNotification`.
