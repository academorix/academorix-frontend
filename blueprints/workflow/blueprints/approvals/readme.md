# approvals

The multi-party approval workflow engine. Wave 1b infrastructure. This is
the load-bearing module for governance: every SOC 2 CC6.3 access-review
control, ISO 27001 A.9.2 user-access-management control, and PCI-DSS 8.5
privileged-access control ties an audit trail requirement to an
`approval_instance`.

## 1. What this module owns

| Concern                              | Owned artefact                                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Approvable-actions registry          | `ApprovableAction` (populated at boot from `#[AsApprovableAction]` discovery)                                                        |
| Runtime approval templates (per tenant) | `ApprovalTemplate` + `ApprovalTemplateApprover` (D-A4: templates are RUNTIME DATA — never code)                                   |
| Approval-flow ledger                 | `ApprovalInstance` — one row per triggered flow, polymorphic subject                                                                 |
| Approver-group snapshots             | `ApprovalRequirement` — one row per group per instance; carries the snapshotted `resolved_approvers` array                           |
| Individual decisions                 | `ApprovalDecision` — write-once, audit-critical                                                                                      |
| Reminder audit                       | `ApprovalReminder` — de-dup by composite unique                                                                                      |
| The `approve` middleware             | Intercepts `#[AsApprovableAction]`-decorated action invocations; creates instances or passes through                                  |
| Rule engine                          | `symfony/expression-language`-backed evaluator for `when_expression` + approver selector expressions                                 |
| Approver selector engine             | `ApproverSelectorEngine` — walks role() / user() / permission() / owner_of() / manager_of() / any() / all() / except()               |
| Delegation-aware resolution          | Consults `access/delegation::role_delegations` at instance-create time to substitute OOF approvers                                   |
| Compliance audit reports             | Cross-tenant snapshots — SOC 2 + ISO 27001 evidence path                                                                             |

## 2. Design decisions (locked from `access-approvals/design.md` §2)

### D-A4 — approval templates are runtime data (never code)

Approval flows are configured by tenant admins via UI, stored in DB, evaluated
by a rule engine at request time. Code declares which actions are *approvable*
via `#[AsApprovableAction(actionKey: '...')]`; code NEVER declares templates
or rules.

**Rejected alternative:** a `#[RequiresApproval(template:, when:)]` static
attribute carrying the rule config. Would require a code deploy every time
approver rules change — untenable when governance evolves faster than release
cadence.

### D-A5 — `approve` middleware, not `HasApprovals` trait

The approval check runs as HTTP middleware, not as a trait. The `approve`
middleware reads the target action's `#[AsApprovableAction]` attribute via
reflection, looks up templates for `(tenant, action_key)`, evaluates the rule
engine, and either passes through or defers execution.

**Rejected alternative:** a trait intercepting `__invoke()`. PHP mechanics
don't support intercepting `__invoke()` after arguments have been resolved —
the trait would run AFTER the action's args are validated but BEFORE it runs,
and swapping the run for a deferred-execution response wasn't cleanly
expressible. Middleware is the correct seam.

### D-A6 — `symfony/expression-language` for the rule engine

Battle-tested, cache-compilable, sandbox-friendly, custom-function-extensible.

**Rejected alternatives:**
- `json-logic-php` — weaker grammar; no function composition; no operator
  precedence beyond what JSON permits.
- Custom DSL — yak shave. A rule engine is a solved problem; writing our
  own generates zero value + significant maintenance.
- OPA / Cerbos / Cedar — polyglot-only; adds a network hop or a Rust
  sidecar to every approval decision. Reserve for the day we go polyglot
  microservices (year 3 at earliest).

### D-A7 — separate `approval_template_approvers` table

Approver groups are a normalised table, not a single JSON column on
`approval_templates`.

**Rejected alternative:** single `approvers_json` column with the shape
`[{ selector, quorum, sort_order }, ...]`. Loses SQL queryability (e.g.
"which templates use `role('finance_manager')` as a selector?" becomes a
JSONB-containment query instead of a plain WHERE), and quorum evaluation
against per-group state would need to be replayed from the parent JSON
blob on every decision.

## 3. The end-to-end flow

### 3.1 Request time

```
POST /api/v1/refunds
  Headers: Authorization: Bearer <cashier PAT>
           X-Application-Id: app_sports
  Body: { invoice_id, amount_cents: 75000, reason: 'defective_product' }

Route middleware stack:
  1. auth:sanctum
  2. resolve.application
  3. resolve.tenant
  4. permission:refunds.create        (RBAC gate — from access/rbac)
  5. approve                          (approval middleware — from this module)
  6. RefundInvoiceAction::__invoke   (the actual invokable action)

Step 5 (approve) does:
  a. Read RefundInvoiceAction's #[AsApprovableAction(actionKey: 'billing.refunds.issue')]
  b. Check Context::scoped('approvals.executing') — if this equals the instance_id
     from a re-dispatch, pass through (prevents infinite loops)
  c. SELECT approval_templates WHERE tenant_id=? AND application_id=?
     AND action_key='billing.refunds.issue' AND is_active=true ORDER BY priority ASC
  d. Call RefundInvoiceAction->approvalContext(RefundData, Invoice) → snapshot
     { invoice_id, amount_cents: 75000, currency: 'USD', requester_role: 'cashier', ... }
  e. For each template ordered by priority: evaluate template.when_expression against
     the snapshot via ExpressionLanguageAdapter — FIRST match wins
  f. If no template matches → pass through to step 6 (the action runs normally)
  g. Match found ("Refunds over $500" template):
     - BEGIN transaction
     - INSERT approval_instances { requester_id, action_key, subject=Invoice,
       context_json, template_id, template_version, requested_at, expires_at }
     - For each ApprovalTemplateApprover on the template:
       - Call ApproverSelectorEngine::resolve($selector_expression, $context)
       - The engine substitutes delegators for delegates (fires DelegationSubstitutedApprover)
       - INSERT approval_requirements { instance_id, group_id, sort_order, resolved_approvers[] }
       - Set status='pending' if sort_order = MIN; else 'blocked'
     - COMMIT
     - Fire ApprovalRequested event (afterCommit) → NotifyApproversJob dispatches
       ApprovalRequestedNotification to each resolved approver
     - Return 202 Accepted with { instance_id: 'api_...', status: 'pending', approvers[] }
```

### 3.2 Approver decision

```
POST /api/v1/approvals/instances/api_.../requirements/apr_.../approve
  Body: { comment: 'Confirmed defect via customer support' }

Route middleware stack:
  1. auth:sanctum
  2. resolve.application
  3. resolve.tenant
  4. permission:approvals.instances.approve
  5. approvals.enforce_approver       (defense-in-depth: caller_is_approver check)
  6. ApprovalDecisionController@approve

Flow:
  a. Verify auth()->user()->id IN requirement.resolved_approvers
     → three independent layers enforce this: caller_is_approver validation rule
       + approvals.enforce_approver middleware + ApprovalDecisionObserver
     → any layer refusing fires ApprovalSecurityViolation(violation_type='forged_decision')
  b. Verify requirement.status='pending' AND instance.status='pending' AND
     no existing approval_decision for (requirement, approver)
  c. INSERT approval_decisions { requirement_id, approver_id, decision='approve',
     delegated_from_id (if via delegation), comment, request_ip_hash }
  d. Fire ApprovalDecisionRecorded event
  e. QuorumEvaluator::evaluate(requirement) — checks quorum_type + quorum_n:
     - 'any': 1 approve → satisfied
     - 'all': every user_id in resolved_approvers must approve
     - 'n_of_m': at least quorum_n approves
  f. If satisfied:
     - Set requirement.status='satisfied' + satisfied_at
     - Fire ApprovalRequirementSatisfied
     - Unblock siblings with next sort_order (status='blocked' → 'pending')
     - Notify new pending approvers
  g. If ALL requirements now satisfied on the parent instance:
     - Set instance.status='approved' + decided_at + final_decider_id
     - Fire ApprovalGranted (SYNCHRONOUS — see next step)
```

### 3.3 Deferred execution — the critical handoff

```
Listener: ApprovalInstanceExecutor (registered with priority=100 on ApprovalGranted)
  Runs SYNCHRONOUSLY inside the caller's transaction context:
    a. Load instance.payload_json + resolve action class from approvable_actions
    b. approve_scope($instance->id, fn () => $action(...$args))
       - The helper sets Context::scoped('approvals.executing') = $instance->id
       - Dispatches the action via container
       - The approve middleware sees the scoped flag + passes through (no re-instance)
       - Action runs → returns result
    c. UPDATE approval_instances SET status='executed', executed_at=now(),
       execution_result_json=... WHERE id=?
    d. Fire ApprovalExecuted event (afterCommit)

Cross-module bridges listen for ApprovalExecuted with matching action_key:
  - access/requests::AccessRequestGrantMaterializer for 'access.grants.create'
    → calls access/grants::GrantIssuer::issue() to materialise the grant row
  - billing::ChargeProcessor for 'billing.refunds.issue'
    → calls the Stripe/Paddle SDK to actually refund the money
  - identity::ImpersonationExtender for 'identity.impersonation.extend'
    → mutates impersonation_sessions.expires_at
```

### 3.4 Rejection

```
POST /api/v1/approvals/instances/api_.../requirements/apr_.../reject
  Body: { comment: 'Exceeds refund policy — see policy §4.2' }

Flow:
  a. Same guards as approve
  b. INSERT approval_decisions { decision='reject', comment: min 10 chars ... }
     — comment is REQUIRED with min length (SOC 2 CC6.3 evidence)
  c. Fire ApprovalDecisionRecorded
  d. QuorumEvaluator: a reject on quorum_type='all' fails the whole requirement;
     on 'any' the requirement stays pending until enough approves accumulate OR
     enough rejects make quorum unreachable
  e. If requirement.status='failed' → fire ApprovalRequirementFailed →
     parent instance → status='rejected' → fire ApprovalRejected
  f. NotifyRequesterOfDecisionJob → ApprovalRejectedNotification to the requester
```

### 3.5 Recall / withdraw

```
POST /api/v1/approvals/instances/api_.../withdraw
  (Requester only; template.allows_recall must be true; status must be 'pending')

  a. Verify auth()->user()->id === instance.requester_id
  b. Verify instance.status='pending'
  c. Verify template.allows_recall=true
  d. Set instance.status='cancelled' + cancelled_at
  e. Every pending requirement → status='failed'
  f. Fire ApprovalCancelled → NotifyPendingApproversJob (so they don't waste time reviewing)
```

### 3.6 Timeout + escalation

```
Scheduled: approvals:expire-overdue (every 5 minutes)

  Loop:
    SELECT approval_instances WHERE status='pending' AND expires_at < now()
    For each:
      Load template.on_timeout:
        'expire'   → status='expired'; fire ApprovalExpired(final_status='expired')
        'approve'  → status='approved'; synthetic system-decisions on every pending requirement;
                     fire ApprovalGranted; ApprovalInstanceExecutor runs (auto-executes)
        'escalate' → (deferred to Wave 2) — resolve template.escalation_selector → new
                     approver ids appended to pending requirement.resolved_approvers +
                     expires_at extended; fire ApprovalEscalated
```

## 4. Rule engine — `symfony/expression-language`

### 4.1 Variables in `when_expression`

Every key from the action's `approvalContext()` snapshot. Plus framework
built-ins:

- `action_key` — string
- `subject_type` / `subject_id` — the polymorphic subject
- `context` — the full context object (also spread as top-level vars)
- `requester` — the User attempting the action (id, roles[], tenant_id, application_id)
- `tenant` — the current Tenant
- `now` — server timestamp
- `today` — server date

### 4.2 Selector functions

Available in approver selector expressions:

| Function | Returns | Availability | Notes |
|---|---|---|---|
| `role(role_name)` | `User[]` | All tiers | Delegation-aware. Every User in the tenant holding this role — with active delegators replaced by their delegates. |
| `user(user_id)` | `User \| null` | All tiers | Delegation-aware. |
| `permission(perm_name)` | `User[]` | All tiers | Every User with this permission (via role or direct assignment). |
| `owner_of(resource_type, resource_id)` | `User \| null` | All tiers | The `created_by` of the resource. |
| `any(sel1, sel2, ...)` | `User[]` | All tiers | Set-union. |
| `all(sel1, sel2, ...)` | `User[]` | All tiers | Set-intersection. |
| `except(sel, user_or_list)` | `User[]` | All tiers | Set-difference. |
| `manager_of(user)` | `User \| null` | Enterprise | Resolves via user_metadata.manager_id — nullable when the tenant doesn't populate the field. |
| `chain_up_to(role_selector)` | `User[]` | Enterprise | Walk the org tree upward from requester until first user matching the role_selector; deferred to Wave 2. |

### 4.3 Security constraints

- Expressions run inside `ExpressionLanguageAdapter::evaluate()` with a hard
  wall-clock deadline (default 250ms, `config('approvals.expression.timeout_ms')`).
- The language subset is CLOSED — no PHP method calls, no arbitrary code
  execution. Tenant admins cannot ship arbitrary logic through the field.
- Parse errors + runtime errors + timeouts fire `ApproverSelectorEvaluationFailed`
  (critical audit) and refuse instance creation.
- Compiled ASTs cached in Redis for 60s per expression source SHA-256.

### 4.4 Preflight — dry-run before saving

`POST /approvals/templates/preflight` takes a `PreflightTemplateInput` with a
synthetic context + expression + groups. Returns `{ parses, would_match,
selectors: [{ resolved_approvers, delegation_substitutions }] }` without
persisting. Powers the template-authoring UI's "test rule" + "preview
approvers" affordances.

## 5. Delegation-aware approver resolution (§7 of design.md)

`access/delegation` maintains active `role_delegations` rows. The
`ApproverSelectorEngine` consults these on every selector resolution:

```
Selector: role('finance_manager')

Resolution:
  1. Fetch all users with 'finance_manager' role in current tenant (via
     access/rbac::PermissionResolver)
  2. For each such user, check for active role_delegations WHERE
     delegator_id = user_id AND (role_id = finance_manager's id OR role_id IS NULL)
     AND now BETWEEN starts_at AND ends_at AND revoked_at IS NULL
  3. Replace each delegated user with their delegate in the resolved set
  4. Fire DelegationSubstitutedApprover per substitution
  5. Return the deduplicated union
```

**OOF example.** Alice (finance_manager) is on vacation and has delegated all
her roles to Bob for the week. A refund approval requiring
`role('finance_manager')` resolves to `[Bob]` instead of `[Alice]` for the
duration.

**Freeze-at-instance-create semantics.** The delegation lookup happens at
instance-create time — the substitutions are BAKED into `resolved_approvers`.
If a delegation is activated AFTER an instance is created, existing
requirements DON'T retroactively substitute — the reconciler
(`ReconcileTemplateVersionsJob`) detects delegation-drift nightly and
dispatches supplementary reminders where appropriate.

## 6. Cross-module wiring

```
this module → depends on:
  identity/user (User model, resolved_approvers[user_ids])
  platform/tenancy (tenant scope + BelongsToTenant global scope)
  platform/application (X-Application-Id contract)
  notifications (channel dispatch for ApprovalRequestedNotification et al)
  access/rbac (role() + permission() selector functions consult PermissionResolver)
  access/delegation (RoleDelegation index for OOF substitution)
  entitlements (approval_templates_max_active slot + entitlement gates)
  compliance (retention regime + tenant policy hooks)

this module ← consumed by:
  access/requests (creates approval_instances via CreateAccessRequestAction #[AsApprovableAction])
  access/grants (indirect — via AccessRequestGrantMaterializer on ApprovalExecuted)
  every domain module that decorates an action with #[AsApprovableAction]
```

## 7. Retention

| Entity | Hold | Trigger |
|---|---|---|
| `approvable_actions` | Indefinite | Never hard-deleted; is_active=false to hide |
| `approval_templates` (any version) | Indefinite while tenant active | TenantErased → cascade |
| `approval_instances` (executed) | 7 years (SOC 2 CC6.3 evidence) | Purge past 2555 days |
| `approval_instances` (rejected/expired/cancelled) | 90 days | Purge past 90 days |
| `approval_decisions` | Matches parent instance | Never redacted or truncated |
| `approval_reminders` | Matches parent requirement | Cascade with parent |
| Auditable audit records | 7 years | Separate purger; outlives subject |

## 8. Non-goals

- **No custom rule engine.** `symfony/expression-language` is the only supported syntax.
- **No cross-tenant approvals.** Every instance is tenant-scoped by definition.
- **No cross-application approvals.** application_id is fixed at instance-create.
- **No approval-of-approval (recursive).** An action_key is either approvable
  or it isn't.
- **No approver-side decision reassignment.** Once decided, a decision is
  immutable. Retract via a new approve/reject flow.
- **No signature-based approvals** (biometric, digital signature) in Wave 1b.
- **No approval-bot / auto-decide policies.** Every decision needs a human OR
  a service-account with `approvals.decide.system` (enterprise only, deferred
  to Wave 2).
- **No conditional-execution.** A template either approves or it doesn't; no
  "approved with conditions".
- **No approver-chaining beyond template sort_order groups.** Groups are
  parallel (sort_order shared) OR fully sequenced (sort_order distinct).
  Mixing requires two templates chained via a state machine — deferred.
- **No offline approvals** (approve via email link click without login). Every
  approve/reject requires an authenticated request.
- **No numerical scoring / weighted approvals.** All approvals are binary
  (approve/reject). Weighted votes deferred.
- **No expression editor UI in Wave 1b.** Admins write expressions in a plain
  text field with docs + a preflight endpoint for validation. Visual builder
  is Wave 2.
- **No policy versioning independent of templates.** Templates ARE the versioned
  policy artefact. Instances snapshot template_version at create time.

## 9. Compliance signals

Every event fires with the compliance module's audit-log annotations attached.
The following are P0 for downstream SIEM ingestion:

- `ApprovalExecuted` — the moment tenant state actually changed (SOC 2 CC6.3
  evidence)
- `ApprovalRejected` — negative decision with named final_decider + reason
- `ApprovalSecurityViolation` — forgery attempt or invariant breach (immediate
  Slack alert to #security-alerts)
- `ApprovalExecutionFailed` — wedged state; the module's health probes report
  this as a readiness failure

## 10. What this module does NOT do

- **Doesn't own the actions.** Actions live in their owning modules
  (billing.refunds.issue in billing, identity.impersonation.extend in
  identity/auth, access.grants.create in access/requests). This module owns
  the approval flow around them.
- **Doesn't hold cardholder data / PHI / PII in context_json.** Actions are
  contractually required to strip regulated_secret / PCI-DSS PAN data from
  their `approvalContext()` output. The engine trusts the action; the PCI-DSS
  scanner is a safety net.
- **Doesn't own delegation semantics.** `access/delegation` owns the
  `role_delegations` table + activation/revocation lifecycle. This module
  READS the delegation index at instance-create time.
- **Doesn't own the notification transports.** Reminder + decision-outcome
  dispatch is via the notifications module's channel drivers. This module
  owns the reminder CADENCE + de-dup logic.
- **Doesn't do policy-as-code (OPA/Cerbos/Cedar).** Deferred — Symfony
  ExpressionLanguage is the PHP-native pragmatic choice for the monolith. If
  we go polyglot microservices in year 3, we reconsider.

## 11. Approval Template Governance

### 11.1 Version bumps

Semantic-behaviour field changes on a template trigger a version bump:

- `when_expression`
- `on_timeout` (behaviour)
- `allows_recall`
- `expires_after_hours`
- Any group change (add/edit/remove `approval_template_approvers`)

Non-semantic changes (name, description, priority, reminder_config) update
in place — no bump.

A version bump inserts a NEW row (`version+1`, `is_active=true`) and sets
`is_active=false` on the old row. Existing pending instances continue
against their pinned version — subsequent template edits don't retroactively
change their semantics.

### 11.2 One-is-active invariant

At most ONE row per `(tenant_id, application_id, action_key, name)` has
`is_active=true` at any moment. Enforced by `ApprovalTemplateObserver` on
creating + updating. Violation on creating → deactivates the peer.
Reconciler runs nightly as a defensive check.

### 11.3 System-shipped defaults

`SeedSystemApprovalTemplates` listener runs on `TenantProvisioned` and
inserts a small set of platform-shipped default templates (see
`data/system-approval-templates.json`) with `is_active=true` + `priority=100`
so tenant custom templates (priority 1..50) override them.

Shipped defaults include:

- `billing.refunds.issue` (amount > $500) → role('finance_manager')
- `access.grants.create` (permissions include 'admin') → any(owner_of(resource), role('tenant_admin'))
- `identity.impersonation.extend` (ttl > 3600s) → role('security_officer')

Tenants on approval_templates_custom=false use ONLY these defaults;
approval_templates_custom=true unlocks authoring.
