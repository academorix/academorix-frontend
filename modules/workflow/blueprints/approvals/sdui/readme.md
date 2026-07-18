# approvals — SDUI surface

Server-driven UI screens for the approval-engine tenant admin surface. Two
resource families:

## Approval instance surface

- `resources/approval-instance/list.screen.json` — "My approvals" — the
  caller's own submitted approval instances, filtered by status.
- `resources/approval-instance/pending-my-review.screen.json` — Approvers'
  inbox — instances where the caller sits in a pending requirement's
  resolved_approvers.
- `resources/approval-instance/show.screen.json` — Detail view — the
  requirements timeline + decisions history + subject summary + approve/reject
  affordances.

## Approval template surface (tenant admin)

- `resources/approval-template/list.screen.json` — Template CRUD listing.
- `resources/approval-template/edit.screen.json` — Author + edit templates
  with the preflight-powered "test expression" + "preview approvers"
  affordances.
- `resources/approval-template/preflight.widget.json` — Widget embedded on
  the edit screen — dry-runs an expression + selector against a synthetic
  context.

## Widgets

- `widgets/approval-status-chip.widget.json` — Colored chip for `status`
  column across list + show views.
- `widgets/quorum-progress-bar.widget.json` — Progress bar showing "2 of 3
  approved" for pending requirements.
- `widgets/decision-timeline.widget.json` — Vertical decision timeline for
  the show view.
- `widgets/approver-avatar-stack.widget.json` — Compact avatar-stack of a
  requirement's resolved_approvers.

## Design notes

- Every screen subscribes to `tenant.{tenantId}.approvals` + `user.{userId}.approvals`
  for real-time list updates.
- Detail views ALSO subscribe to `approval-instance.{instanceId}` for
  timeline-level updates.
- The approve + reject buttons on the detail view are contextually shown only
  when the caller is in a pending requirement's resolved_approvers.
- The template editor's "test expression" widget hits the preflight endpoint
  with debounce (500ms) so authors get instant syntax-check feedback.
- Every screen honours the caller's approvals.decisions.view_comments
  permission — comments render as `[hidden]` chips when the caller lacks it.
