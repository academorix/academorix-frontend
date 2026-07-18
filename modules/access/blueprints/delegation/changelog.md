# delegation — module changelog

Auditor-friendly per-artefact changelog.

## 2026-07-15 — Module inception

- **add** — folder `modules/access/blueprints/delegation/` with the full
  blueprint artefact set (module.json, readme.md, 2 schemas, relations, traits,
  routes, middleware, events, listeners, observers, jobs, schedule, commands,
  notifications, broadcasts, policies, permissions, features, feature-flags,
  entitlements, health, metrics, analytics, caches, retention, compliance,
  data-classes, errors, subprocessors, config, settings, rules, helpers, data
  fixtures, sdui).
- **model contract** — 2 entities: `RoleDelegation` (tenant-plane, delegator
  + delegate + optional role + starts_at + ends_at + revoked_at + reason +
  delegation_type) and `ImpersonationSession` (cross-plane, impersonator
  PlatformUser + impersonated User + snapshot fields + session_token_hash +
  ends_at + is_read_only + end_trigger).
- **trait contract** — owns `HasDelegations` (composed on tenant `User`;
  exposes activeDelegations() + activeAsDelegate() relations + fluent
  delegate() / revokeDelegation() helpers) and `HasImpersonationHistory`
  (composed on BOTH tenant `User` + `PlatformUser` — dual usage for both
  sides of the impersonation session).
- **attribute contract** — 2 discovery attributes: `AsDelegationListener`
  (services reacting to delegation lifecycle) and `AsImpersonationListener`
  (services reacting to impersonation lifecycle — heavy audit + compliance
  writes go here).
- **resolver contract** — `DelegationResolver` — the single service every
  consumer (RBAC PermissionResolver + workflow/approvals approver selector)
  hits to walk active delegations for a given (user, tenant, application)
  tuple. Enables OOF-aware approver resolution (see access-approvals/design.md
  §7).
- **impersonation PAT bridge** — `ImpersonationSessionIssuer` bridges into
  identity/auth's `ImpersonateStartAction` (the start-point deferred from
  identity module per identity/design.md §12) to mint the impersonation-scoped
  Sanctum PAT + write the impersonation_sessions row atomically.
- **middleware** — `delegation.enforce_delegate_context` flags the request
  with `active_delegation_id` in RequestContext when the caller acts as a
  delegator; `impersonation.enforce_active_session` refuses the request when
  the impersonation PAT's session is ended; `impersonation.enforce_read_only`
  refuses mutating verbs when `session.is_read_only=true`.
- **audit + compliance** — impersonation is 7-year hot retention (SOC 2
  compliance evidence); delegations are 2-year retention. Impersonation
  session records survive PlatformUser hard-delete via snapshot columns
  (impersonator_display_name + impersonator_department captured at session
  start, immutable thereafter).
- **HIPAA-adjacent hook** — session.metadata.compliance_regime opens the door
  for tenant-specific additional audit requirements when a healthcare tenant
  adopts.
- **entitlements** — `role_delegation` (all tiers), `emergency_delegation`
  (medium + enterprise), `impersonation` (per-PlatformUser, NOT a tenant
  entitlement — belongs to platform-user seed data),
  `read_only_impersonation` (enterprise), `impersonation_extended_ttl`
  (enterprise, contract-negotiated only).
- **rules** — `valid_delegation_window` (starts_at ≥ now, ends_at ≤ starts_at
  + 90d), `delegator_holds_role` (cross-check against RBAC),
  `same_tenant_delegation` (cross-tenant refused), `impersonation_ttl_within_bounds`
  (≤ 60 min unless extended_ttl entitlement), `impersonation_reason_min_length`
  (40 chars minimum — heavier than delegation's 20).
- **retention** — RoleDelegation 730 d hot then hard-purge via
  `PurgeRevokedDelegationsJob`; ImpersonationSession 7 y hot (never purged),
  `session_token_hash` NULLED after 30 d via `PurgeImpersonationSessionsJob`
  (the token is dead anyway; scrubbing removes even the hash residue).
- **compliance** — SOC 2 CC6.1 + CC6.7 (impersonation actor audit), PCI-DSS
  8.5 (MFA required for impersonation start via platform_admin guard's
  mandatory MFA), GDPR Art. 17 exception (impersonator actions retained under
  Art. 17(3)(e) legal claims defence).
