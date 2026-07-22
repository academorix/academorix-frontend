# ADR 0031 — `application_id` central-plane extension: 8-row mandate becomes a named 12-row list

**Status:** Accepted **Date:** 2026-07-21 **Deciders:** Data lead + Backend
architecture + Security lead

## Context

ADR-0027 codified the three-axes column contract that governs every persisted
row across the workspace: `tenant_id`, `application_id`, `scope_node_id`. Its D2
pins **EXACTLY 8 rows** as the closed set that carry `application_id` directly:

```
tenants
users
roles
permissions
tenant_subscriptions
entitlement_licenses
audits
activity_log
```

`.kiro/steering/tenancy-columns.md §2` mirrors this locked list and adds:
"**Everything else is forbidden from carrying `application_id`.** Application
flows through `tenant_id → tenants.application_id`."

The `tenancy-compliance-auditor` sweep of 2026-07-21 (see
`.kiro/reports/tenancy-compliance-auditor-2026-07-21.md`) found **15 additional
tables** currently carrying `application_id` in violation of §2. Reading the
migrations + interface docblocks + the architectural context for each of the 15,
two clearly-distinct subgroups emerge:

**Subgroup A — Central-plane infrastructure (4 rows).** These rows carry
`application_id` because they operate **above** the tenant plane in the request
lifecycle. No `tenant_id → tenants.application_id` cascade path exists at their
layer, so a direct `application_id` FK is architecturally required. The four
are:

- **`plans`** (VIO-008; `packages/backend/billing/subscription/`) — the product
  catalog. Each Application has its own plan catalog (Sports plans differ from
  Marketplace plans); a plan row is per-Application by construction. Plans exist
  BEFORE any tenant subscribes to them, so cascade through `tenants` is
  nonsensical.
- **`auth_jwt_signing_keys`** (VIO-009; `packages/backend/identity/auth/`) —
  per-Application HS256 signing keys. Each Application rotates its own JWKS
  keyring; identity- service issues JWTs signed with the caller's Application's
  active key. Central-plane identity infrastructure; no tenant scope.
- **`service_accounts`** (VIO-010;
  `packages/backend/identity/service-accounts/`) — machine credentials per
  Application. Central-plane identity per
  `docs/contracts/service-identity.schema.json` (referenced by ADR-0022 Seam 1).
  Sanctum PAT issuance for cross-service RPC is scoped per Application; a
  `service_account` row exists before any tenant claims it.
- **`domains`** (VIO-014; `packages/backend/platform/domains/`) — host
  resolution runs BEFORE tenant resolution in the request lifecycle. The
  `ResolveApplication` + `ResolveTenant` middleware chain answers
  `WHERE application_id = ? AND host = ?` against `domains` before it knows
  which tenant the caller belongs to. Central-plane host substrate; no tenant
  cascade path exists at the moment `domains` is queried.

**Subgroup B — Domain drift (11 rows).** These rows carry `application_id`
because a generator template or an inherited migration seeded the column without
thinking through the cascade path. Every one of them has a legitimate cascade —
through `tenants.application_id`, `users.application_id`,
`roles.application_id`, or `permissions.application_id` — that already answers
the "which Application?" question with no direct column needed. The eleven are:

- **`role_delegations`** (VIO-001; access/delegation) — cascades through
  `role_id → roles.application_id`.
- **`invitations`** (VIO-002; access/invitations) — cascades through
  `tenant_id → tenants.application_id` and `role_id → roles.application_id`.
- **`invitation_events`** (VIO-003; access/invitations) — cascades through
  `invitation_id → invitations.tenant_id → …`.
- **`model_has_permissions`** (VIO-004; access/rbac spatie pivot) — cascades
  through `permission_id → permissions.application_id`.
- **`model_has_roles`** (VIO-005; access/rbac spatie pivot) — cascades through
  `role_id → roles.application_id`.
- **`role_has_permissions`** (VIO-006; access/rbac spatie pivot) — cascades
  through both parents.
- **`access_request_projections`** (VIO-007; access/requests) — cascades through
  `user_id → users.application_id`.
- **`in_app_messages`** (VIO-011; notifications/notifications-in-app) — cascades
  through `tenant_id → tenants.application_id`.
- **`push_subscriptions`** (VIO-012; notifications/notifications-push) —
  cascades through `user_id → users.application_id`; composite unique index
  reduces from `(user_id, application_id, device_token_fingerprint)` to
  `(user_id, device_token_fingerprint)` since Application is derivable from
  `user_id`.
- **`notifications`** (VIO-013; notifications/notifications) — cascades through
  `tenant_id → tenants.application_id`.
- **`approval_templates`** (VIO-015; workflow/approvals) — cascades through
  `tenant_id → tenants.application_id`; composite unique reduces from
  `(tenant_id, application_id, action_key, name, version)` to
  `(tenant_id, action_key, name, version)`.

The pattern is clear: Subgroup A has an architectural reason to carry the
column; Subgroup B is drift that a generator emitted and nobody caught until the
compliance sweep. Two subgroups, two different fixes.

## Options considered

1. **Add all 15 rows to §2 (rejected).** Would legitimize the 11 drift rows and
   open the mandate to unbounded drift going forward. Every future generator
   emission that includes `application_id` on a domain row would then have
   precedent.
2. **Add a "central-plane exception" clause to §2 without naming rows
   (rejected).** An unnamed exception is an invitation to further drift. Every
   new package would decide for itself whether its rows qualify; the mandate
   becomes advisory rather than enforceable. The `tenancy-compliance-auditor`
   agent would lose its ability to answer "is this row compliant?" with a yes /
   no answer.
3. **Drop `application_id` from all 15 rows and rewrite the 4 central-plane
   consumers to derive Application from context (rejected).** For `domains`
   (host resolution runs before tenant resolution) and `auth_jwt_signing_keys`
   (JWKS keyring lookup runs before any tenant scope is loaded), no derivation
   path exists at the moment the row is queried. Forcing derivation would
   introduce request-lifecycle circular dependencies.
4. **Extend §2 to a named 12-row list; drop `application_id` from the other 11
   (chosen).** Names the four central-plane rows explicitly. Preserves the
   "closed set" character of the mandate — the list grows only via ADR
   amendment. Domain drift is dropped, cascades restored to their legitimate
   parents.

## Decision

### D1 — Extend `tenancy-columns.md §2` to a named 12-row list

The 8-row mandate becomes a 12-row mandate. The four new rows are added as a
**named, closed extension** — not an open-ended exception clause. The full
12-row list:

```
Row                       Column                Notes
────────────────────────  ────────────────────  ──────────────────────────
tenants                   application_id  ✅    required, UNIQUE(application_id, slug)
users                     application_id  ✅    required, UNIQUE(identity_id, application_id)
roles                     application_id  ✅    nullable (null = platform_admin guard)
permissions               application_id  ✅    nullable (null = platform_admin guard)
tenant_subscriptions      application_id  ✅    required, scoped by (application_id, tenant_id)
entitlement_licenses      application_id  ✅    required, scoped by (application_id, tenant_id)
audits                    application_id  ✅    required for tenant-audience, nullable for platform
activity_log              application_id  ✅    required for tenant-audience, nullable for platform
plans                     application_id  ✅    required — product catalog is per-Application
auth_jwt_signing_keys     application_id  ✅    required — JWKS keyring is per-Application
service_accounts          application_id  ✅    required — machine credentials scoped per Application
domains                   application_id  ✅    required — host resolution runs above tenant plane
```

The four new rows carry `application_id` as **required**, not nullable — their
central-plane role does not have a "platform-wide" audience the way `audits` and
`activity_log` do (audit rows can be platform-audience because a super-admin
action legitimately has no tenant / no application; plans + JWKS + service
accounts + domains are always per-Application by construction).

### D2 — Every row on the 12-row list belongs to central-plane infrastructure OR a per-Application aggregate

The 12 rows share a defining property: they either **operate above the tenant
plane** (host resolution, JWT signing, service- identity issuance) or they are
**the per-Application top-level aggregate** that every tenant-scoped row
cascades through (`tenants`, `users`, `roles`, `permissions`,
`tenant_subscriptions`, `entitlement_licenses`, `audits`, `activity_log`,
`plans`).

Adding a 13th row requires a new ADR that names it. The list is CLOSED, not
OPEN. This is the entire point of naming instead of gating with a rule of thumb.

### D3 — Drop `application_id` from the 11 domain-drift rows

The 11 rows enumerated in Subgroup B above drop the `application_id` column.
Per-row migration + interface changes:

| #   | Row                          | Package                            | Cascade path                 | Composite index change                                                                              |
| --- | ---------------------------- | ---------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | `role_delegations`           | access/delegation                  | `roles.application_id`       | none                                                                                                |
| 2   | `invitations`                | access/invitations                 | `tenants.application_id`     | none                                                                                                |
| 3   | `invitation_events`          | access/invitations                 | `invitations.tenant_id`      | none                                                                                                |
| 4   | `model_has_permissions`      | access/rbac                        | `permissions.application_id` | none                                                                                                |
| 5   | `model_has_roles`            | access/rbac                        | `roles.application_id`       | none                                                                                                |
| 6   | `role_has_permissions`       | access/rbac                        | both parents                 | none                                                                                                |
| 7   | `access_request_projections` | access/requests                    | `users.application_id`       | none                                                                                                |
| 8   | `in_app_messages`            | notifications/notifications-in-app | `tenants.application_id`     | none                                                                                                |
| 9   | `push_subscriptions`         | notifications/notifications-push   | `users.application_id`       | `(user_id, application_id, device_token_fingerprint)` → `(user_id, device_token_fingerprint)`       |
| 10  | `notifications`              | notifications/notifications        | `tenants.application_id`     | none                                                                                                |
| 11  | `approval_templates`         | workflow/approvals                 | `tenants.application_id`     | `(tenant_id, application_id, action_key, name, version)` → `(tenant_id, action_key, name, version)` |

Each drop is a Laravel migration under
`database/migrations/<timestamp>_drop_application_id_from_<table>_table.php` in
the row's owning package, with an explicit `down()` that adds the column back
for reversibility. `ATTR_APPLICATION_ID` is removed from each row's
`<Row>Interface.php`.

Composite index rewrites (rows 9 + 11) are part of the same migration as the
column drop.

### D4 — Steering follow-up: update `tenancy-columns.md §2` in a doc-only PR

`.kiro/steering/tenancy-columns.md §2` is updated in a doc-only PR to name the
12-row list. That update is routed to `docs-adr-steward` as a Phase D follow-up.
The steering update also touches:

- `tenancy-columns.md §2 Enforced by` — the "outside the 8 rows" phrase becomes
  "outside the 12 rows".
- `tenancy-columns.md §5 Non-goals (forbidden columns)` — the `application_id`
  forbidden row's "except the 8 named in §2" phrase becomes "except the 12 named
  in §2".
- `tenancy-columns.md §9 Living gap register` — the 11 drop-column tasks land as
  closed rows once the E9 batch commits.
- ADR-0027 D2 — the "8 rows" phrase in its Decision section is augmented with a
  "See ADR-0031 for the four central-plane infrastructure rows codified as a
  scoped extension" pointer. The 8-row list itself stays in ADR-0027 as the
  historical record; ADR-0031 pins the extension.

### D5 — `tenancy-compliance-auditor` allow-list updated

The `tenancy-compliance-auditor` agent's compliance check for R3 (illegal
`application_id`) updates to allow the 4 new central-plane rows without a
violation flag. The 11 drift rows drop off the violation list once the E9
migrations land. The updated allow-list lives in the agent's charter (routed via
`docs-adr-steward`).

### D6 — Application resolution paths stay unchanged

D1's extension does NOT change how Application is resolved in request lifecycle:

- **Host → Application** — resolved via `domains.application_id` (unchanged;
  this is why `domains` needs the column).
- **JWT → Application** — resolved via `auth_jwt_signing_keys. application_id`
  (unchanged; per-Application JWKS lookup).
- **Service RPC → Application** — resolved via `service_accounts.application_id`
  (unchanged; per-Application machine credentials).
- **Plan → Application** — resolved via `plans.application_id` when a tenant
  subscribes (a plan pre-exists the subscription; the subscription cascades
  through the plan).
- **Everything else** — cascades through `tenants.application_id` (unchanged;
  every domain row below Tenant answers "which Application?" via its tenant).

## Consequences

**Positive:**

- **`db:migrate --seed` runs green on the 4 central-plane rows.** Their
  `application_id` columns are architecturally legitimate; the compliance sweep
  flagged them as violations only because §2 didn't name them. Naming resolves
  the false positive.
- **The 11 drift rows drop the column cleanly.** Composite indexes narrow to the
  natural key; queries speed up (no redundant `application_id = ?` predicate on
  rows where Application is already implied by `tenant_id`).
- **The mandate stays enforceable.** A closed 12-row list means the
  `tenancy-compliance-auditor` agent can answer "compliant?" with a yes / no
  answer.
- **Central-plane vs domain-plane boundary is codified.** Future packages that
  ship central-plane infrastructure (a new identity-service concern, a new
  host-resolution row) know they need an ADR extending this list before adding
  `application_id`.

**Negative:**

- **11 migrations must ship** to drop `application_id` from the drift rows.
  Batched as E9 in `tasks.md`. Estimated 3 hours per the triage summary.
- **Two composite unique indexes must be rewritten** (rows 9 + 11). The rewrites
  are semantically identity-preserving —
  `push_subscriptions.(user_id, device_token_fingerprint)` and
  `approval_templates.(tenant_id, action_key, name, version)` are the correct
  natural keys once Application is dropped as a redundant discriminator.
- **Downstream code that reads `ATTR_APPLICATION_ID` on any of the 11 rows**
  must migrate to reading the column from the parent
  (`$row->user->application_id`, `$row->role->application_id`, etc.). Verified
  via grep; count is small (fewer than 20 callsites across the 11 packages).

**Neutral:**

- **This ADR EXTENDS ADR-0027; it does NOT supersede it.** ADR-0027's core
  three-axes contract stays load-bearing. The 8-row mandate stays in ADR-0027 as
  the historical record; ADR-0031 layers the 4 named central-plane rows on top
  as a scoped extension. Both ADRs remain in force.
- **The `tenant_id` mandate is untouched.** Every tenant-scoped domain row still
  carries `tenant_id`; every model still composes `BelongsToTenant`. This ADR is
  scoped to `application_id` attribution, not tenant attribution.
- **The scope substrate mandate is untouched.** `scope_node_id` is still
  confined to configuration consumers per ADR-0027 D4.

## Follow-up work

The ADR itself is a design decision. Execution is a mix of doc + code commits:

1. **Steering update (docs-adr-steward, one commit).** Update
   `tenancy-columns.md §§2, 5, 9` to name the 12-row list. Update ADR-0027 D2
   with a forward pointer to this ADR (the pointer already exists in the
   ADR-0027 body — verify it references ADR-0031 by number).
2. **`tenancy-compliance-auditor` allow-list (docs-adr-steward, one commit).**
   Update the agent charter's R3 check to recognise the 4 new central-plane rows
   as compliant.
3. **E9 migration batch (codebase-housekeeper OR laravel-feature- builder, one
   commit per row-owning package — 6 packages total).** Drop `application_id`
   from the 11 drift rows; rewrite the 2 composite unique indexes; update the 11
   `<Row>Interface.php` files to remove `ATTR_APPLICATION_ID`; migrate
   downstream callsites.
4. **Verify** `php artisan migrate --seed` on fresh SQLite passes.
5. **Verify** the `tenancy-compliance-auditor` re-run reports zero R3 violations
   on the 15 rows this ADR addresses.

That work is batched as `E9` in `tasks.md` and unblocks the Phase E tail (the
last outstanding compliance sweep). It does not require a schema migration on
already-deployed databases — this codebase is pre-first-deployment.

## Related work

- ADR-0027 — Row-level attribution: three-axes column contract (the general rule
  this ADR extends; D2's 8-row mandate becomes the anchor for this ADR's 12-row
  list).
- `.kiro/steering/tenancy-columns.md §2` — the mandate this ADR extends.
  Steering update per D4 above is a follow-up doc-only commit routed to
  `docs-adr-steward`.
- `.kiro/steering/tenancy-columns.md §5 (Non-goals)` — the forbidden-columns
  table that lists `application_id` on domain rows as banned; §5 is updated in
  the same follow-up commit.
- `.kiro/steering/tenancy-columns.md §7 (tenancy-compliance- auditor agent)` —
  the agent whose R3 allow-list this ADR updates.
- `.kiro/steering/tenancy-columns.md §9 (Living gap register)` — the register
  that closes on this ADR + the E9 batch.
- `.kiro/steering/hierarchy.md §6 (Module responsibility map)` — the module
  ownership context for the 4 central-plane rows and the 11 domain rows.
- `.kiro/reports/tenancy-compliance-auditor-2026-07-21.md §VIO-001 through §VIO-015`
  — the 15 violations enumerated in the compliance sweep.
- `.kiro/reports/data-modeler-2026-07-21.md §NEW-GAP-002` — the aggregate
  finding that motivated this ADR.
- `.kiro/reports/00-triage-summary-2026-07-21.md §Compliance violations (C6)` —
  the triage entry that scoped Phase E9.
- ADR-0022 — Language-agnostic service boundary (the `service_accounts` +
  `auth_jwt_signing_keys` rows are Seam 1 + Seam 2 substrate).
