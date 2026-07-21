# grants

Per-resource dynamic access grants. Google-Docs-style "share this thing with
Bob" — but generic enough to work over every domain aggregate in the platform.
Overlays above the RBAC role tables owned by `access/rbac`.

## 1. What this module owns

| Concern                      | Owned artefact                                                                                                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persistent grant table       | `AccessGrant` (subject-polymorphic, resource-polymorphic, JSONB permission list, decision enum, expiry, revoke trail)                                                                                                     |
| The overlay resolver         | `GrantOverlayResolver` — consulted by `access/rbac`'s `PermissionResolver` on every check (per D-A3)                                                                                                                      |
| The central issue action     | `GrantIssuer` — the one place grants are minted, whether from manual admin CRUD, from access-request approvals, or from delegation flows                                                                                  |
| The revoke action            | `GrantRevoker` — the one place grants are torn down (soft-delete + audit)                                                                                                                                                 |
| Grantable-registry substrate | `GrantableRegistry` container binding — consumer modules register `resource_type` keys at boot so grants stay polymorphic across the whole platform                                                                       |
| Per-request caching          | `GrantEvaluationCache` — L1 in-process + L2 Redis. Warmed by the `grants.warm_grant_cache` middleware on Sanctum PAT usage; invalidated per-subject on `GrantIssued` / `GrantRevoked` / `GrantExpired`                    |
| Traits + attribute           | `HasResourceGrants` (compose on invitable-target-shaped models), `IsGrantable` (marker), `BelongsToGrant` (provenance on the User/Role row produced by a grant), `#[Grantable]` class attribute (resource-type discovery) |
| Bulk provision               | CSV bulk-issue for larger enterprise deployments                                                                                                                                                                          |
| Notifications                | Subject + grantor notifications on issue / revoke / expiring / expired; opt-in "denied access attempt" notification for admins                                                                                            |
| Compliance                   | SOC 2 CC6.3 access provisioning audit, ISO 27001 A.9.2.5 access reviews, GDPR Art. 17 erasure cascade                                                                                                                     |

## 2. Placement rationale

Sits at priority **32** — after `access/rbac` (priority 30, roles + permissions
must exist before grants can reference them) and before `access/requests`
(priority 34, which builds the Google-Docs-style request flow on top of grants).

The module boots after RBAC because:

- Grants reference permission names that live in the `permissions` table owned
  by RBAC; the `PermissionCatalogueValidator` cross-checks the names.
- The overlay resolver is called _by_ RBAC — RBAC has to know it exists.

The module boots before `access/requests` because access requests materialise
into grants on approval. Requests are a workflow wrapper, grants are the state
that gets written.

Same-plane sibling of `access/delegation` (priority 33) — grants and delegations
share the RBAC substrate but never write each other's rows.

## 3. The overlay contract (D-A3, canonical)

Every `Gate::allows($user, $permission, $resource)` walks this order:

```
1. Explicit deny grants for (principal, resource_type, resource_id)
     → deny wins. Return false. Short-circuit.
2. Explicit allow grants for (principal, resource_type, resource_id)
     → return true. Short-circuit RBAC.
3. RBAC roles on the principal
     → return true if any role grants `permission`.
4. Delegation — if principal is a delegate under access/delegation:
     - Re-evaluate steps 1-3 as the DELEGATOR.
     - Union: (delegate's own grants ∪ delegator's grants) − denies from either.
5. Default deny.
```

Steps 1 and 2 are this module's business. Step 3 is RBAC. Step 4 is delegation.
Deny wins because it is inviolable — an admin explicitly saying "Bob CANNOT
touch this invoice" cannot be undone by Bob's role. This is the safety guarantee
we sell.

## 4. Entities

Single aggregate. No related event / audit table of our own — every mutation
threads through `activity/laravel-activitylog` (via `HasActivityLog`) and
`owen-it/laravel-auditing` (via `HasAudit`).

| Model         | Storage | Purpose                                                                                                                                                                                                                                                                        |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AccessGrant` | table   | One row per grant. Polymorphic subject + resource, JSONB `permissions` array, `decision` enum (`allow` / `deny`), `granted_by` FK, `granted_at`, nullable `expires_at`, revoke trail (`revoked_at + revoked_by + revoked_reason`), `source` enum, `source_reference`, `reason` |

Composite indexes on the hot-paths — see `schemas/access-grant.schema.json`.

## 5. Lifecycle

```
                                    grants.grantor holds permissions being granted +
                                    resource + subject in same tenant + reason ≥ 20 chars
                                                    │
                                                    ▼
                              ┌─────────────► issued (row inserted, GrantIssued fires)
        POST /grants          │                       │
        ────────────►         │                       │       admin PATCH (expires_at, reason)
        approvals AccessRequestApprovedListener       ├──► updated (GrantUpdated)
        ────────────►         │                       │
                              │                       │       Purge NotifyGrantExpiringJob
                              │                       ├──► expiring (24h warning notification)
                              │                       │
                              │                       │       expires_at reached; PurgeExpiredGrantsJob
                              │                       ├──► expired (GrantExpired, terminal)
                              │                       │
                              │                       │       admin DELETE / revoke reason
                              │                       └──► revoked (GrantRevoked, terminal)
                              │
                              │  ReconcileOrphanedGrantsJob (weekly)
                              │  resource no longer exists →
                              └──► auto-revoked with revoked_reason='orphaned'
```

Terminal states: `expired`, `revoked`. Once terminal, the row lives for the
retention window (90 days) and is then hard-deleted by `PurgeRevokedGrantsJob` /
`PurgeExpiredGrantsJob`.

## 6. Public surface

### Tenant host (authenticated tenant users)

The three shapes:

- **CRUD** — list, create, show, patch, delete.
- **Enumeration** — `/subject/{id}` (admin — every grant this principal holds),
  `/resource/{type}/{id}` (resource owner or admin — every grant on this
  resource).
- **Bulk** — CSV upload (`bulk_grant_provision` entitlement).

All routes carry per-endpoint policies from `AccessGrantPolicy` and enforce
`ApplicationMismatch` / cross-tenant refusal at the observer layer.

### Platform-admin host

Read-only + audit-report generator. Cross-tenant search for support tooling +
compliance evidence.

## 7. The three ways grants get created

1. **Manual admin CRUD** — an owner or admin hits `POST /api/v1/grants` from the
   tenant dashboard. `source = 'manual'`.
2. **Access request approval** — `access/requests` opens a `workflow/approvals`
   instance with `action_key = 'access.grants.create'`. On `ApprovalExecuted`
   where the action key matches, this module's `AccessRequestApprovedListener`
   reads `approval_instance.context_json` and calls `GrantIssuer::issue(...)`
   with `source = 'access_request'`,
   `source_reference = <approval_instance_id>`.
3. **Bulk provision** — enterprise-only. Admin uploads a CSV (subject_id,
   resource_type, resource_id, permissions, expires_at, reason).
   `source = 'bulk_provision'`.

A fourth `source = 'delegation'` is reserved for `access/delegation` when it
lands — delegation-driven grants (e.g. a manager delegating "grant edit on all
my invoices to my assistant for two weeks") route through the same issuer.

## 8. What this module does NOT do

- **No group-based grants in Wave 1b.** `subject_type` is technically
  polymorphic and the resolver walks it that way, but only `User` is registered.
  `Group` is deferred to Wave 2 alongside the group-management module.
- **No conditional grants.** A grant either exists or it doesn't. "Grant IF the
  invoice amount > $500" is what `workflow/approvals` templates are for — the
  gate is on the way in, not on the row itself.
- **No cross-tenant grants.** Refused by observer + rule; a cross-tenant grant
  is a schema violation. Cross-app SSO is the correct pattern for cross-tenant
  collaboration.
- **No cross-guard grants.** A grant issued under the `sanctum` guard never
  applies on the `platform_admin` guard, and vice versa. Enforced by
  `GuardMismatch` (422) on the issue path.
- **No revocation cascade.** Grants are independent. Revoking Alice's grant on
  invoice #123 does not touch Bob's grant on the same invoice.
- **No policy versioning.** A revoked grant is a revoked grant — the row is
  preserved with the revoke trail for the retention window, but it never
  resurfaces. Reconstructing "who had access on 2024-06-15" is a job for the
  audit stream, not a grant history feature.

## 9. Terminology

- **Grant** — the record.
- **Subject** — the polymorphic principal receiving the permission
  (`subject_type` + `subject_id`; today always a User).
- **Resource** — the polymorphic target of the permission (`resource_type` +
  `resource_id` — Invoice, Athlete, Team, …).
- **Grantor** — the User who issued the grant. `granted_by` FK. Nullable for
  system-issued grants (approvals, bulk provision).
- **Permissions** — the JSONB array of permission names scoped to that specific
  resource. No scope suffix — the resource is explicit, so `invoices.view` in a
  grant on `Invoice#123` means "view THIS invoice".
- **Decision** — `allow` (positive grant) or `deny` (inviolable block).
- **Reason** — mandatory operator note. Minimum 20 chars. Retained for audit
  indefinitely; never redacted on grant expiry.
- **Source** — where the grant came from. `manual` / `access_request` /
  `delegation` / `bulk_provision`. Enables reverse-lookup from the source
  system.

## 10. Cross-references

- Design spec: `.kiro/specs/access-approvals/design.md` §2 D-A3 (deny wins), §3
  access_grants shape, §6 access request flow.
- Sibling: `modules/access/rbac/` — the substrate this module overlays.
- Sibling: `modules/access/requests/` — the wrapper that opens approval
  workflows for grant creation.
- Sibling: `modules/access/delegation/` — the delegation table the resolver
  consults on step 4 of the overlay chain.
- Sibling: `modules/workflow/approvals/` — the engine that emits
  `ApprovalExecuted` events consumed by our `AccessRequestApprovedListener`.
- Steering: `.kiro/steering/hierarchy.md` §4 (two-audience boundary).
- Steering: `.kiro/steering/tenancy-columns.md` — grants are tenant-scoped;
  `application_id` cascades through `tenant_id` (grants are NOT one of the eight
  rows that carry `application_id` directly).

## 11. Blueprint layout (this folder)

```
modules/access/blueprints/grants/
├── module.json / readme.md / changelog.md
├── schemas/
│   └── access-grant.schema.json
├── relations.json, traits.json, attributes.json, routes.json, middleware.json
├── events.json, listeners.json, observers.json, hooks.json
├── jobs.json, schedule.json, commands.json
├── notifications.json, broadcasts.json
├── policies.json, permissions.json, features.json, entitlements.json
├── health.json, metrics.json, analytics.json, caches.json, retention.json
├── compliance.json, data-classes.json, errors.json, rules.json
├── feature-flags.json
├── config.json, settings.json
├── data/access-grants.json
└── sdui/
    ├── resources/access-grant/{list,create,show}.screen.json
    ├── screens/audit-resource-access.screen.json
    └── widgets/{grant-decision-chip,share-access-dialog}.widget.json
```
