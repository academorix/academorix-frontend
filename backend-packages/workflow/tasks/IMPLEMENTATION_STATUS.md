# workflow/tasks — Phase 3 implementation status

## Status: PARTIAL — Tier-1 lifecycle Actions DONE; assignment / comment CRUD + reminder cron pending

## What landed (commit `ece08f14a`)

### Task lifecycle Actions (real implementations, replace `return null`)

- **`CompleteAction`** — POST `/tasks/{task}/complete`. Transitions
  non-terminal status → `completed`, stamps `completed_at`,
  fires `TaskCompleted` with the actor's user id. Refuses
  already-terminal tasks with 422 `TaskTerminalStateException`.
  `#[RequirePermission(TasksComplete)]`.
- **`CancelAction`** — POST `/tasks/{task}/cancel`. Mirror of
  Complete for the `cancelled` transition. Fires
  `TaskCancelled`. Same terminal-state guard.
  `#[RequirePermission(TasksCancel)]`.

### TaskAssignment lifecycle Actions

- **`AcceptAction`** — POST
  `/tasks/{task}/assignments/{assignment}/accept`. Four-part
  guard chain:
  1. Route-model check on `{assignment}`.
  2. URL cross-check: `assignment.task_id === {task}` URL
     segment.
  3. Ownership check: `assignment.user_id === current Sanctum
     user`.
  4. Terminal-state guard: refuse when `accepted_at` OR
     `declined_at` OR `unassigned_at` is set.
  Fires `TaskAssignmentAccepted`.
- **`DeclineAction`** — POST
  `/tasks/{task}/assignments/{assignment}/decline`. Same guards
  + validated `DeclineAssignmentRequestData` (required reason).
  Fires `TaskAssignmentDeclined`.

### DTOs

- **`DeclineAssignmentRequestData`** — Spatie Data DTO with
  required `reason` (max 500 chars).

## What's pending

### Actions to complete (currently return `null`)

- **`AssignmentsAssignmentAction`** — GET
  `/tasks/{task}/assignments`. List a task's assignments.
- **`UpdateAssignmentAction`** — PATCH
  `/tasks/{task}/assignments/{assignment}`. Update `role`,
  reassignment (updates `user_id`).
- **`DeleteAssignmentAction`** — DELETE
  `/tasks/{task}/assignments/{assignment}`. Sets
  `unassigned_at`. Fires `TaskUnassigned`.
- **`CreateAssignmentAction`** (missing entirely) — POST
  `/tasks/{task}/assignments`. Assign a task to a user.
- **`CommentsCommentAction`** — GET `/tasks/{task}/comments`.
  List a task's comments (paginated).
- **`CreateCommentAction`** (missing entirely) — POST
  `/tasks/{task}/comments`. Attach a comment.
- **`UpdateCommentAction`** — PATCH
  `/tasks/{task}/comments/{comment}`. Author-only, 15-min edit
  window (`TaskCommentEditWindowExpiredException`).
- **`DeleteCommentAction`** — DELETE
  `/tasks/{task}/comments/{comment}`. Author-only OR admin.
  Fires `TaskCommentDeleted`.
- **`ListTaskAction`** — GET `/tasks`. Paginated list.
  Filter by `status`, `priority`, `assignee`, `subject_type`,
  `due_before`.
- **`ShowTaskAction`** — GET `/tasks/{task}`.
- **`UpdateTaskAction`** — PATCH `/tasks/{task}`. Field edits
  (title / description / priority / due_at). Refuse edits on
  terminal tasks.
- **`DeleteTaskAction`** — DELETE `/tasks/{task}`. Soft-delete.
- **`CreateTaskAction`** — POST `/tasks`. Already scaffolded
  (auto-generated `->repository->create`); needs a follow-up to
  emit `TaskCreated` + validate `subject_type` against the
  `TaskSubjectRegistry`.

### Services + registries

- **`TaskSubjectRegistry`** — attribute-driven whitelist of
  valid `subject_type` values. `#[TaskSubject]` on the model
  it's attached to. Refuses unknown subjects with
  `TaskSubjectTypeUnknownException`.
- **`TaskStateMachine`** — canonical transitions (open /
  in_progress / blocked / completed / cancelled). Currently
  the lifecycle Actions hardcode the terminal-state check;
  hoist into a service.
- **`TaskReminderScheduler`** — sends reminders as
  `reminder_at` approaches.
- **`TaskAssignmentReassigner`** — routes a declined assignment
  to a fallback user (round-robin, workload-aware).
- **`TaskCommentEditor`** — enforces the 15-min edit window +
  author-ownership check.

### Jobs

- **`RemindDueTasksJob`** — cron: hourly. Marks tasks due < 24h
  as reminder-eligible; fires notifications via
  `notifications/notifications`.
- **`EscalateOverdueTasksJob`** — cron: daily. Escalates tasks
  past `due_at` with no action. Fires `TaskOverdue`.
- **`AutoUnassignStaleTasksJob`** — cron: daily. Unassigns
  assignments that have been pending accept > N days.

### Cross-module dependencies

- **`growth/leads::LeadReassigned`** — a lead reassignment
  should fire a `CreateTaskAction` for the new owner (via a
  listener in this module).
- **`sports/athlete::AthleteEnrolled`** — kicks off onboarding
  tasks.
- **`notifications/notifications`** — every task lifecycle
  event has a notification consumer.
- **`identity/user`** — the assignee's user record.
- **`workflow/automations`** — deferred module that would fire
  `CreateTaskAction` on domain events. See its own
  IMPLEMENTATION_STATUS.md.

## Backlog priorities

1. **P0 — `CreateAssignmentAction` + `TaskAssignmentReassigner`**
   — enables the reassignment loop.
2. **P0 — `CommentsCommentAction` + `CreateCommentAction`** —
   base comment CRUD.
3. **P0 — `UpdateCommentAction` (15-min window)** — author edit
   UX.
4. **P1 — `RemindDueTasksJob`** — the reminder cron.
5. **P1 — `ListTaskAction` + `ShowTaskAction`** — read surface.
6. **P2 — `EscalateOverdueTasksJob`** + `TaskOverdue` fan-out
   — long-term hygiene.
