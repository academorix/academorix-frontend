# staff

Employed/engaged person operating within a Tenant Branch. Wave 2b
infrastructure.

## 1. What this module owns

| Concern                    | Owned artefact                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Employment record          | `Staff` — wraps a User row with employment metadata (position, department, hire dates, employment_status, ...).          |
| Coaching profile           | `Coach` — Staff-satellite adding per-sport coaching data (specialization, certifications, rating, availability).         |
| Employment lifecycle       | pre_hire → active → on_leave / suspended / offboarding → offboarded, plus rehire path (offboarded → active).             |
| Coach lifecycle            | active → paused → archived (terminal), decoupled from parent Staff's employment state.                                   |
| Branch manager invariant   | Exactly one active `is_branch_manager=true` Staff per branch (partial unique index).                                     |
| Compensation tracking      | Opt-in `staff_compensation_tracking` entitlement. Regulated financial data. 7-year retention in a separate audit stream. |
| Emergency contact tracking | `emergency_contact_name/phone/relationship` + `tax_id_last4`. Confidential-tier. 90-day post-offboarding purge.          |
| Org chart                  | Enterprise-only `reports_to_staff_id` self-reference + direct-reports resolver + org-chart visualisation.                |
| Coach certifications       | JSONB array on Coach. Add/remove/expire lifecycle. Optional HR verification (Enterprise-only).                           |
| Coach availability         | JSONB per-day windows overriding parent Staff.weekly_hours for coaching-specific scheduling.                             |
| Coach rating               | Nightly-aggregated 0-5 star rating from Wave 3+ session ratings. Public display gated by entitlement.                    |

### 1.1 The two owned tables

- `staff` — the employment record. Belongs to `Tenant` + `Branch` + `User`.
- `coaches` — the coaching profile satellite. Belongs to `Tenant` + `Staff`;
  cascades everything else.

Plus one audit-adjacent table:

- `staff_compensation_history` — write-only audit stream for every
  compensation_* mutation. 7-year retention independent of the parent Staff row
  (migrates to compliance archive on tenant erasure).

None of these carry `application_id`, `organization_id`, `region_id`, or
`scope_node_id` — all cascade or are inapplicable. Enforced by the
tenancy-compliance-auditor + observer refusal chains.

## 2. Tier gating

The `staff` feature itself is available on every tier — every tenant needs
staff. Tier gates apply to CAPACITY + ENTERPRISE-ONLY features.

- **Small** — 5 staff slots, 1 coach slot. No org chart, no cert verification.
- **Medium** — 50 staff slots, 10 coach slots. Public coach rating on.
- **Enterprise** — unlimited staff + coaches. Org chart on. Cert verification
  available. Public coach rating on.

Six entitlement keys:

- `staff_slot` (slot cap)
- `coach_slot` (slot cap)
- `staff_compensation_tracking` (boolean; opt-in on ALL tiers — off by default)
- `staff_org_chart` (boolean; Enterprise-only)
- `coach_certifications_verified` (boolean; Enterprise-only)
- `coach_rating_display` (boolean; Medium+)

## 3. The employment lifecycle

```
pre_hire ──(user verifies + activation)──▶ active ──(HR action)──▶ on_leave
   │                                          │                       │
   │                                          │                       └──(return)──▶ active
   │                                          │
   │                                          ├──(disciplinary)──▶ suspended ──(reinstate)──▶ active
   │                                          │
   │                                          └──(HR action)──▶ offboarding ──(confirm)──▶ offboarded
   │                                                                                          │
   └──(TTL past staff.hire.pre_hire_ttl_days, ~60 days)──▶ terminated_before_start          │
                                                                                             │
                                                          offboarded ──(rehire)──▶ active
                                                                (rare)
```

Terminal states: `offboarded` (soft-terminal — can rehire via `reactivate`),
`terminated_before_start` (hard-terminal — no rehire).

**Every non-pre_hire transition consumes ONE unit of staff_slot on entry to
active and RELEASES it on transition to offboarded.** Rehires re-consume; the
entitlement gate always reflects live headcount.

## 4. The coach lifecycle

Independent of the parent Staff (mostly):

```
active ──(pause)──▶ paused ──(resume)──▶ active
  │                    │
  │                    └──(archive)──▶ archived
  │
  └──(archive)──▶ archived (terminal)
```

Cascade paths TIED to the parent Staff (via
`CascadeCoachStatusOnStaffOffboarding` hook):

- Staff → on_leave / suspended → linked Coach transitions to `paused`
  (metadata.paused_by='staff_leave' / 'staff_suspension')
- Staff → offboarding → linked Coach transitions to `paused` (pending final
  archive on `offboarded`)
- Staff → offboarded → linked Coach transitions to `archived` + coach_ended_at
  is set

The pause metadata lets `ResumeCoachFromLeave` / `ResumeCoachFromSuspension`
unpause automatically when the parent Staff returns to active — but only if the
pause was cascaded (manually-paused coaches don't auto-unpause).

## 5. The branch-manager invariant

The load-bearing invariant of the module: **exactly one active Staff with
`is_branch_manager=true` per branch, or zero (leaderless is allowed but
warned)**.

Enforced by three layers:

1. **Partial unique index** on (branch_id, is_branch_manager=true,
   employment_status='active', deleted_at IS NULL). DB-level.
2. **StaffObserver** — refuses promotions that would violate + requires atomic
   swap via `/promote-to-manager` route.
3. **ReconcileBranchManagerInvariantJob** — nightly audit; every finding is a P1
   signal.

The `stackra.staff.branch_manager.invariant_violations` metric should stay at 0
for the lifetime of a healthy platform.

## 6. Compensation — the private tier

Compensation is regulated financial data. The module handles it with THREE
separate layers of gating:

1. **Entitlement** — `staff_compensation_tracking` must be ON for the tenant.
   Off by default; HR opts in.
2. **Permission** — `staff.manage.compensation` for writes;
   `staff.view.compensation` for reads. Distinct from `staff.update` /
   `staff.view`.
3. **Delta guard** — changes exceeding
   config.staff.compensation.max_delta_percent (default 50%) require
   `staff.manage.compensation.large-delta` to bypass.

Compensation events dispatch on a SEPARATE `compensation-audit` queue and write
to a SEPARATE `staff_compensation_history` table (not the normal `audits` table)
with 7-year financial-record retention that OUTLIVES the parent Staff row
(migrates to a compliance-archive table on tenant erasure).

Compensation values NEVER surface in the activity feed, NEVER carry through to
analytics events (only the fact-of-change + category), and NEVER broadcast on
any realtime channel.

## 7. Cascades

The module ships several cascades:

- `StaffPutOnLeave` / `StaffSuspended` / `StaffOffboardingStarted` /
  `StaffOffboarded` → linked `Coach` transitions (paused → archived).
- `StaffReturnedFromLeave` / `StaffReinstated` → cascade-paused Coach resumes to
  active.
- `BranchArchived` → `PreventStaffOrphansOnBranchArchived` refuses the archive
  when active Staff still reference the branch.
- `UserSoftDeleted` → `PreventUserArchiveWithActiveStaff` refuses when the User
  has active Staff in any tenant.
- `TenantErased` → cascade delete via FK; compensation_history migrates to
  compliance archive.
- `BranchStatusChanged` → CheckBranchManagerStillPresent diagnostic.

## 8. Retention

- Active + on_leave + suspended staff: never expire.
- Offboarded staff:
  - 90-day PII grace: emergency_contact_* + tax_id_last4 redacted to
    `[REDACTED]`.
  - 7-year employment record retention on the rest of the row.
  - Hard-purge only when no downstream references (Coach, PayrollLine).
- Coach: aligned with parent Staff. Archived + 7 years past coach_ended_at.
- staff_compensation_history: 7 years from row creation. Outlives parent Staff.
  Migrates to compliance archive on tenant erasure.

## 9. What this module does NOT do

- **Multi-branch pivot for staff.** Staff belongs to one home branch in Wave 2b.
  Multi-branch operational assignments (e.g. a floating HR admin) land in Wave
  3+ via `staff_branches` pivot.
- **Branch transfer.** Staff.branch_id is IMMUTABLE post-create in Wave 2b. Wave
  3+ ships the transfer flow + StaffBranchChanged event.
- **Cross-tenant staff transfer.** Offboard + rehire at destination — never a
  "move".
- **Timesheet / attendance tracking.** Deferred to Wave 4 attendance module.
- **Payroll integration.** Deferred to Wave 4 finance module (integrates with
  3rd-party payroll processors that own full-tax-ID storage).
- **Coach discovery/marketplace.** Not the shape of Stackra — coaches belong to
  specific tenants.
- **Auto-provisioning of default staff on TenantProvisioned.** The tenant
  onboarding flow explicitly hires the owner-user as the first Staff.
- **Coach specialization taxonomy.** Free-text in Wave 2b; Wave 3+ sports
  registry adds a controlled list.
- **Sport-key validation.** Soft-warn in Wave 2b; hard-fail against sports
  registry in Wave 3+.
- **Storing full tax IDs.** Only tax_id_last4. Full-ID storage stays with
  3rd-party payroll processor (PII scope containment).

## 10. Cross-references

- `hierarchy.md` §1a — Staff and Coach canonical vocabulary; reject words.
- `hierarchy.md` §14 — belongs-to matrix (Staff → Tenant + Branch + User; Coach
  → Tenant + Staff).
- `hierarchy.md` §16 — decision ladder for adding new domain models.
- `hierarchy.md` §7 — tier matrix (staff always on; org_chart Enterprise;
  compensation opt-in).
- `tenancy-columns.md` §3 — every owned row carries `tenant_id`. Staff carries
  `branch_id` + `user_id`. Coach carries `staff_id`.
- `tenancy-columns.md` §5 — forbidden columns (never `application_id`,
  `organization_id`, `region_id`, `scope_node_id` on staff / coaches).
- `modules/platform/blueprints/branch/` — the parent branch module (branch
  archive prevention hook).
- `modules/identity/blueprints/user/` — the parent user module (user archive
  prevention hook + the shared Profile trait pattern).
- `modules/identity/blueprints/user/relations.json` §accessor_chain — the User
  accessor chain pattern that Staff.WrapsUser mirrors for its own delegated
  accessors.
- `modules/platform/blueprints/facility/` — the sibling multi-entity module.
  Same shape of policy/observer/event conventions.
- `modules/access/blueprints/rbac/` — the RoleDefinition catalogue where the
  `hr` role is defined.

## 11. ULID prefixes owned

- `stf_` (Staff) — new. Register in
  `modules/shared/blueprints/foundation/data/ulid-prefixes.json` at merge time.
- `coa_` (Coach) — new. Register in the same registry entry.

The module ALSO consumes (references) many other prefixes; those are defined by
their owning modules and referenced via FK. Full list in relations.json +
schemas/*.schema.json properties patterns.
