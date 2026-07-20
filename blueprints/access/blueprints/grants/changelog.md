# grants — module changelog

Auditor-friendly per-artefact changelog. Every material blueprint change lands
here with a date + a summary; downstream reviewers (compliance, security,
platform ops) scan this file to know what changed since the last audit.

## 2026-07-15 — Module inception

- **add** — folder `modules/access/blueprints/grants/` with the full blueprint
  artefact set (module.json, readme.md, schema, relations, traits, attributes,
  routes, middleware, events, listeners, observers, hooks, jobs, schedule,
  commands, notifications, broadcasts, policies, permissions, features,
  entitlements, health, metrics, analytics, caches, retention, compliance,
  data-classes, errors, rules, feature-flags, config, settings, data
  fixtures, sdui).
- **model contract** — one entity: `AccessGrant`. Polymorphic subject +
  resource, JSONB `permissions` array, `decision` enum (`allow` / `deny`),
  nullable `expires_at` (enterprise-gated for `null`), full revoke trail.
  Composite indexes on the resolver's hot-path lookup
  `(tenant_id, subject_type, subject_id, resource_type, resource_id, decision)`
  + the expiration-purge scan `(tenant_id, expires_at)` + the reverse-lookup
  from approval `(tenant_id, source, source_reference)`.
- **overlay contract** — GrantOverlayResolver implements the D-A3 overlay
  order: (1) explicit denies win + short-circuit, (2) explicit allows return
  true, (3) fall through to RBAC. Delegation-aware; consulted by
  `access/rbac`'s PermissionResolver at every check.
- **traits + attribute** — `HasResourceGrants` (composed on invitable-target-
  shaped models to expose the grants relation), `IsGrantable` (marker),
  `BelongsToGrant` (traceability). `#[Grantable]` class attribute for
  boot-time resource-type discovery seeded into `GrantableRegistry`.
- **event contract** — 12 lifecycle + evaluation events, all
  `ShouldDispatchAfterCommit`. Includes audit-critical
  `SelfServiceGrantAttempted` (privilege-escalation) +
  `GrantCrossTenantAttempt` (isolation-breach) + `GrantDenialIssued` /
  `GrantDenialRevoked` (denies are inviolable — every write is
  audit-notable).
- **integration seams** — `AccessRequestApprovedListener` on
  `workflow/approvals::ApprovalExecuted` where `action_key ===
  'access.grants.create'` — creates grants materialised from approved access
  requests with `source='access_request'`. Deferred delegation integration
  when `access/delegation` lands.
- **entitlements** — six keys. Basic `resource_grants` is all-tier;
  `bulk_grant_provision` medium+; `permanent_grants` (null expires_at) +
  `deny_grants` + `cross_role_grants` + `grant_audit_report` are enterprise-
  gated.
- **compliance** — SOC 2 CC6.3 access provisioning audit trail; ISO 27001
  A.9.2.5 access reviews supported via
  `grants:audit-principal` + `grants:audit-resource` commands; GDPR Art. 17
  cascade on Identity + resource erasure.
- **retention** — active grants no floor (until revoke or expiry);
  revoked/expired 90-day hot hold then hard-delete; reason text retained
  indefinitely for audit (never redacted after expiry).

### Compatibility

- Depends on `foundation`, `compliance`, `identity`, `user`, `application`,
  `tenancy`, `access/rbac`.
- Inception release.
