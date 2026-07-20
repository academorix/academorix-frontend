# Changelog — approvals

All notable changes to the workflow/approvals module blueprint.

## [1.0.0] — 2026-07-15

### Added

- Initial enterprise-day-1 blueprint for the multi-party approval workflow
  engine. Wave 1b infrastructure.
- Seven owned tables: `approvable_actions`, `approval_templates`,
  `approval_template_approvers`, `approval_instances`, `approval_requirements`,
  `approval_decisions`, `approval_reminders`.
- Three attributes: `#[AsApprovableAction]` (marks an invokable action as gated
  by the engine), `#[AsApprovalListener]` (registers lifecycle listeners),
  `#[RegistersApprovableAction]` (bulk registration on service providers).
- Twenty-three published events covering the full lifecycle — from
  `ApprovableActionRegistered` (boot discovery) through `ApprovalRequested` /
  `ApprovalDecisionRecorded` / `ApprovalGranted` / `ApprovalExecuted` /
  `ApprovalRejected` / `ApprovalExpired` / `ApprovalCancelled` to
  `ApprovalSecurityViolation` (P0 audit) + `DelegationSubstitutedApprover` +
  `ApproverSelectorEvaluationFailed`.
- Seven jobs: `ExpireOverdueApprovalsJob` (5-min sweeper),
  `DispatchApprovalRemindersJob` (hourly), `PurgeExpiredApprovalsJob` (daily
  retention), `NotifyApproversJob`, `NotifyRequesterOfDecisionJob`,
  `ReconcileTemplateVersionsJob` (nightly integrity + delegation-drift),
  `AuditReportGenerationJob` (on-demand compliance snapshot).
- Eight notification categories serving three audiences (approver, requester,
  platform-ops).
- Four policies: `ApprovableActionPolicy` (platform-only registry CRUD),
  `ApprovalTemplatePolicy` (tenant-admin CRUD), `ApprovalInstancePolicy` (5
  abilities: viewAny / view / withdraw / approve / reject),
  `ApprovalDecisionPolicy` (view-only — decisions are write-once).
- Five observers enforcing write-time invariants: action-key format + registry
  integrity, template versioning + one-active constraint, instance
  status-machine, requirement quorum evaluation, decision integrity (the
  security-critical one that closes the direct-DB-write forgery seam).
- Sixteen Artisan commands for support-tooling + template authoring + sweeper +
  audit-report + remediation.
- Six validation rules: `valid_action_key`, `valid_expression`,
  `valid_selector_expression`, `template_active_uniqueness`,
  `caller_is_approver`, `min_reject_comment_length`.
- Three middleware: `approve` (load-bearing — intercepts `#[AsApprovableAction]`
  actions), `approvals.enforce_approver` (defense-in-depth),
  `approvals.throttle_reminders`.
- Twenty-five HTTP routes across tenant + platform planes — template CRUD +
  group CRUD + preflight + instance list + view + withdraw + approve + reject
  - pending-my-review + platform-plane cross-tenant read + audit-report
    generation + registry management.
- Five entitlement keys: `approvals_enabled` (all tiers),
  `approval_templates_custom` (medium+), `approval_templates_max_active` (slot
  cap per tier), `approval_advanced_expressions` (enterprise),
  `approval_audit_report` (enterprise + compliance co-active).
- Twelve bindings: `ApprovableActionRegistry`, `ApprovalTemplateResolver`,
  `ApproverSelectorEngine`, `ApprovalInstanceProvisioner`,
  `ApprovalInstanceExecutor`, `ApprovalDecisionRecorder`, `QuorumEvaluator`,
  `ReminderScheduler`, `ExpressionLanguageAdapter` (wraps
  symfony/expression-language), `TemplateVersioner`, `ApprovalAuditReporter`,
  `ApprovalPresenter`.
- Extensive metrics surface — 22 metrics tracking approval-latency,
  quorum-time-to-decision, expiry-rate, expression-evaluation-timing,
  security-violations, delegation-substitutions, executor-wedged-count.
- Three broadcast channels: `tenant.{tenantId}.approvals`,
  `user.{userId}.approvals`, `approval-instance.{instanceId}`.
- Seven outbound webhook kinds — approvals.instance_requested /
  decision_recorded / instance_granted / instance_rejected / instance_executed /
  instance_expired / security_violation_detected.

### Decided (from `access-approvals/design.md` §2)

- **D-A4** — approval templates are runtime data. Rejected:
  `#[RequiresApproval(template:, when:)]` static attribute (would require code
  deploy to change approver rules).
- **D-A5** — `approve` middleware, not `HasApprovals` trait. Rejected: trait
  intercepting `__invoke()` (PHP mechanics don't support it).
- **D-A6** — `symfony/expression-language` for the rule engine. Rejected:
  json-logic-php (weaker), custom DSL (yak shave), OPA/Cerbos/Cedar
  (polyglot-only complexity).
- **D-A7** — separate `approval_template_approvers` table. Rejected: single JSON
  column (loses SQL queryability).

### Cross-module integration

- `access/requests` module wraps this engine via `CreateAccessRequestAction`
  decorated with `#[AsApprovableAction('access.grants.create')]` — the
  access-request flow IS an approval flow.
- `access/grants::AccessRequestGrantMaterializer` listens for `ApprovalExecuted`
  with `action_key='access.grants.create'` to materialise the grant row after
  approval.
- `access/delegation::RoleDelegation` — this module's `ApproverSelectorEngine`
  consults the delegation index at instance-create time for OOF-aware approver
  substitution. Fires `DelegationSubstitutedApprover` per swap.
- `access/rbac::PermissionResolver` powers the `role()` + `permission()`
  selector functions.
- `notifications` module handles the actual channel dispatch for all approval
  notifications; this module owns the cadence + de-dup logic.
- `compliance` module receives audit signals for SOC 2 CC6.3 + ISO 27001 A.9.2
  - PCI-DSS 8.5 evidence trails.

### Notes

- Wave 1b ships `on_timeout` = `expire` | `approve` only. `escalate` deferred to
  Wave 2.
- Wave 1b ships basic selector set (role, user, permission, owner_of, any, all,
  except). Advanced set (`manager_of`, `chain_up_to`) gated by
  `approval_advanced_expressions` entitlement — enterprise only.
- No visual expression-builder UI in Wave 1b — admins write expressions in a
  plain text field with docs + preflight endpoint for validation.
- No signature-based / biometric / offline / bot approvals in Wave 1b.

## [unreleased]

Nothing yet.
