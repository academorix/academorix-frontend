# growth/leads — Phase 3 implementation status

## Status: PARTIAL — Tier-1 lifecycle + reporter DONE; Attribution snapshot + task orchestration pending

## What landed (commit `23a5e324f`)

### Services (real implementations, replace AUTO-GENERATED stubs)

- **`LeadStageTransitionValidator` + Interface** — canonical state
  machine `NEW → CONTACTED → QUALIFIED → {TRIAL|WON|LOST}`, terminal
  after WON/LOST. Pure functions (`canTransition`,
  `assertTransition`, `nextStagesFrom`, `isTerminal`). WON is
  reachable only via `ConvertAction` — `assertTransition` surfaces
  `LeadInvalidStageTransitionException` with structured context
  (`from`, `to`).
- **`LeadFunnelReporter` + Interface** — three rollups over the
  `leads` table under `BelongsToTenant`:
  - `stageCounts` — every enum case filled to 0 for missing keys.
  - `sourceCounts` — group-by `source`.
  - `conversionRate` — `WON / total` rounded to 4dp. Returns 0.0
    when the tenant has no leads in the window.
  Every query uses `ATTR_*` constants; no raw column strings.
- **`LeadConversionService` + Interface** — the WON path.
  Idempotent on already-converted rows. Guards: state-machine
  transition + `athlete_names` non-empty. Atomic write flips
  `stage=WON`, stamps `converted_at`, appends a `stage_change`
  `LeadActivity`, fires `LeadConverted` after commit. Athlete +
  guardian materialisation is deferred to sports/athlete's
  `MaterialiseAthletesOnLeadConverted` listener — the leads
  module stays bootable stand-alone.
- **`LeadAttributionSnapshotter` + Interface** — soft-links to
  growth/attribution via `container->bound(...)` + duck-typed
  `toSnapshot()`. Falls back to `null` when attribution is absent
  (small-tier tenants).

### Actions (real implementations, replace `return null` stubs)

- **`AssignAction`** — POST `/leads/{lead}/assign`. Validated
  `AssignLeadRequestData` (`usr_*` ULID + optional note).
  Idempotent when `owner_id` already matches. Atomic write:
  `owner_id` + assignment `LeadActivity`. Fires
  `LeadReassigned(reason='manual')` post-commit.
  `#[RequirePermission(LeadsAssign)]`.
- **`ConvertAction`** — POST `/leads/{lead}/convert`. Routes
  through `LeadConversionServiceInterface`; surfaces the two
  domain exceptions cleanly. `#[RequirePermission(LeadsConvert)]`.
- **`CompleteAction`** — POST `/lead-tasks/{lead_task}/complete`.
  Terminal transition to Completed. Refuses already-completed OR
  cancelled tasks with 422 `LeadTaskAlreadyCompletedException`.
  Records `completed_by` + `completed_at` from the acting Sanctum
  user.
- **`ListFunnelAction`** — GET `/leads/reports/funnel`. Envelope
  with `stage_counts` + `source_counts` + `conversion_rate` +
  `period` bounds. Optional `since`/`until` (ISO 8601).
  `#[RequirePermission(LeadsFunnelReportView)]`.
- **`ActivitiesActivitieAction`** — GET `/leads/{lead}/activities`.
  Reverse-chronological timeline paginated by `?per_page=`
  (default 25, capped 100). Route-model-check on the lead first
  so tenant-scoped-out leads yield 404 before the child query
  runs.

### DTOs

- **`AssignLeadRequestData`** — Spatie Data DTO with ULID
  validation + optional note.

## What's pending

### Actions to complete

- **`MoveStageAction`** — POST `/leads/{lead}/stage`. Explicit
  stage transition endpoint (currently reachable via
  `UpdateLeadAction`, but a dedicated Action gives us cleaner
  activity logging + event choreography). Route through
  `LeadStageTransitionValidator::assertTransition()` + emit the
  right per-transition event (`LeadContacted`, `LeadQualified`,
  `LeadTrialBooked`).
- **`MarkLostAction`** — POST `/leads/{lead}/mark-lost`.
  Validated `MarkLostRequestData` (required `lost_reason` enum,
  optional `lost_notes`). Emits `LeadLost`.
- **`NoteAction`** — POST `/leads/{lead}/notes`. Attach a note
  activity to the timeline. Validated `NoteRequestData` (body
  required, max 5000 chars).
- **`SnoozeAction`** — POST `/leads/{lead}/snooze`. Defer follow-up
  until a future timestamp. Needs a new column (or metadata) —
  currently a schema gap.
- **Public-form `CreateLeadAction`** — currently authed. Needs a
  rate-limited public variant at POST `/public/leads` for
  embedded FE forms. Deduplicates on `(tenant_id, contact_email)`
  hash within a 24-hour window.

### Services to complete

- **`LeadAttributionSnapshotter::currentSnapshot()`** — currently
  duck-types the attribution context. Once growth/attribution's
  `AttributionContextInterface` shipping shape is locked, tighten
  the contract with a hard type reference.
- **`LeadConversionService`** — needs a follow-up
  `MaterialiseLeadConversionJob` (already scaffolded as a stub)
  wired into the sports/athlete listener chain. Currently the
  event fires but no listener exists yet in this workspace tree.

### Repositories

- **`LeadRepository::findByEmailHash`** — dedup lookup for the
  public-form path.
- **`LeadActivityRepository::forLead`** — dedicated query with
  cursor pagination (`occurred_at` DESC + `id` DESC as
  tie-breaker) for large timelines.
- **`LeadTaskRepository::dueBefore`** — cron support for the
  `SendLeadFollowUpJob` scaffold.

### Jobs

- **`MaterialiseLeadConversionJob`** — stub already scaffolded.
  Needs to route to `sports/athlete::AthleteProvisioner::provision`.
- **`SendLeadFollowUpJob`** — cron-driven. Reads
  `lead_tasks.due_at < now` + fires notifications via the
  notifications module.
- **`ReassignStaleLeadsJob`** — reassign leads whose owner has
  been unassigned or has been inactive N days.
- **`CloseStaleLeadTasksJob`** — auto-cancel `open` tasks after N
  days.

### Cross-module dependencies

- **`sports/athlete`** — the `MaterialiseAthletesOnLeadConverted`
  listener. Currently referenced in `LeadConverted`'s "consumers"
  docblock but not yet implemented.
- **`growth/attribution`** — the `AttributionContextInterface`
  shape. Snapshotter is soft-linked.
- **`workflow/tasks`** — `LeadReassigned` should fire a
  `CreateTaskAction` for the new owner via an event listener.
- **`notifications/notifications`** — three consumers named in
  event docblocks (`DispatchLeadCapturedNotification`,
  `DispatchLeadAssignedNotification`,
  `DispatchLeadConvertedNotification`).

## Backlog priorities

1. **P0 — `MarkLostAction` + `MoveStageAction`** — completes the
   base stage lifecycle. Blocks the FE Kanban board.
2. **P0 — public `CreateLeadAction` + rate limiter** — blocks
   embed-on-website intake forms.
3. **P1 — `MaterialiseLeadConversionJob`** — wires up the
   downstream athlete provisioning.
4. **P1 — `NoteAction`** — trivial, but the FE lead-detail page
   needs it.
5. **P2 — `SnoozeAction`** — schema change first (add
   `snoozed_until` column).
6. **P2 — cron jobs** — `Send`/`Reassign`/`Close` need config +
   Horizon queue registration.
