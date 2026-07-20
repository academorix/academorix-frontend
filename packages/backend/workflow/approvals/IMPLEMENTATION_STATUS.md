# workflow/approvals — Phase 3 implementation status

## Status: SCAFFOLDED — approval-template + submission-lifecycle models landed; every Action returns `null`

## What landed

- **`ApprovalTemplate`** — configurable template per subject type (min
  approvers, required approver roles, timeout policy, escalation policy).
- **`ApprovalSubmission`** — one row per approval cycle (subject_type +
  subject_id, template_id, status, submitted_by, final_decision).
- **`ApprovalDecision`** — one row per approver's approve/deny vote
  (submission_id, user_id, decision, note, at).
- Enum types (`ApprovalStatus`, `ApprovalDecisionKind`,
  `ApprovalTemplateStatus`).
- Attribute-first migrations, factories, permission seeder.
- Blueprint-emitted Action stubs (every one returns `null`).

## What's pending

### Actions to complete

- **`CreateApprovalTemplateAction`** — POST `/approval-templates`. Admin
  configures a new template.
- **`UpdateApprovalTemplateAction`** — same for updates. Live templates cannot
  mutate (immutable once used); create a new version instead.
- **`ListApprovalTemplateAction`** / `ShowApprovalTemplateAction` — read.
- **`ActivateTemplateAction`** — POST `/approval-templates/{id}/activate`. Flip
  `is_active` to promote a version. Only one active per (tenant, subject_type).
- **`SubmitForApprovalAction`** — POST `/approvals/submit`. Body:
  `subject_type`, `subject_id`, `template_id`. Creates the submission + fans out
  approval requests to every required approver via
  `notifications/notifications`. Emits `ApprovalRequested`.
- **`ApproveAction`** — POST `/approvals/{id}/approve`. Records the decision.
  When all required approvers agree, fires `ApprovalGranted` + calls back the
  requesting module via a registered listener.
- **`DenyAction`** — POST `/approvals/{id}/deny`. Immediately terminates the
  submission (single deny). Fires `ApprovalDenied`.
- **`RecallAction`** — POST `/approvals/{id}/recall`. The requester withdraws.
- **`EscalateAction`** — POST `/approvals/{id}/escalate`. Auto- called by
  `EscalateApprovalJob` on timeout; can also be invoked manually by an admin.
- **`ListSubmissionAction`** / `ShowSubmissionAction` — read. Filter by
  `status`, `requested_by`, `pending_from_me`.

### Services + registries

- **`ApprovalTemplateResolver`** — subject_type → active template lookup.
- **`ApprovalOrchestrator`** — the state machine: pending →
  approved/denied/timed_out/recalled.
- **`ApproverResolver`** — expands a template's required-roles policy into
  concrete user ids (via role permissions).
- **`ApprovalCallbackRegistry`** — attribute-driven registry of
  `#[ApprovalCallback]` handlers per subject_type. When `ApprovalGranted` fires
  for a subject, the registered handler is invoked so the requesting module can
  apply the approved change (create the order, promote the athlete, etc.).
- **`ApprovalPolicyEnforcer`** — cross-decision guard: refuse a second decision
  from the same approver, refuse a decision after the submission is terminal.

### Jobs

- **`EscalateApprovalJob`** — cron: hourly. Runs the timeout policy per active
  template.
- **`ExpireApprovalsJob`** — cron: daily. Auto-denies submissions past their
  absolute timeout.

### Events

- **`ApprovalRequested`** — submission created.
- **`ApprovalDecisionRecorded`** — every approve/deny vote.
- **`ApprovalGranted`** — all required approvers agreed.
- **`ApprovalDenied`** — a required approver denied OR auto-timeout.
- **`ApprovalEscalated`** — timeout policy fired.
- **`ApprovalRecalled`** — requester withdrew.

### Cross-module dependencies

- **`finance/order::OrderCreated`** — orders may require approval before
  fulfilment.
- **`sports/athlete::AthletePromotionRequested`** — promoting an athlete tier
  may require approval.
- **`platform/teams::RosterChangeRequested`** — team roster changes may require
  coach + admin approval.
- **`identity/user`** — approver identity.
- **`notifications/notifications`** — every event has a notification consumer.

## Backlog priorities

1. **P0 — `CreateApprovalTemplateAction`** — enables admin configuration.
2. **P0 — `SubmitForApprovalAction`, `ApproveAction`, `DenyAction`** — the base
   cycle.
3. **P0 — `ApprovalCallbackRegistry`** — cross-module callback framework. Every
   consumer registers `#[ApprovalCallback]`.
4. **P1 — `RecallAction`** — requester withdraw.
5. **P1 — `EscalateApprovalJob`** — timeout enforcement.
6. **P2 — `ExpireApprovalsJob`** — long-term cleanup.

**Note:** the approval framework is a large surface. Before implementation,
review the blueprint under `modules/workflow/blueprints/approvals/` for the
exact schema

- event shape. The design questions to resolve:

* **Sequential vs parallel approvers** — currently the model assumes parallel
  (all must agree). Sequential (approver-1 first, then approver-2) is a
  template-level toggle.
* **Delegation** — can approver-A delegate to approver-B for a vacation? Suggest
  a `delegate_to_id` field on `ApprovalDecision`.
* **Approval chains** — multi-tier (branch → tenant → platform) is a common
  pattern.
