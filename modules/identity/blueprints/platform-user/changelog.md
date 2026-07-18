# platform-user — changelog

## [Unreleased] — inception (Wave 1a)

- Platform-user module authored. Two entities: `PlatformUser`,
  `PlatformProfile`.
- Guard: `platform_admin` (distinct from tenant plane's `sanctum` guard).
- Cross-plane by construction — no `tenant_id`, no `application_id` on either
  entity.
- Reuses the `identity/identity` substrate for credentials via `identity_id`
  FK. UNIQUE constraint on `identity_id` enforces one PlatformUser per
  Identity.
- MFA-mandatory: hire-time gate (`PlatformUserObserver.creating` refuses
  creation when the referenced Identity has NULL `mfa_secret_encrypted`) +
  runtime `platform.mfa_required` middleware.
- Employment lifecycle state machine on `PlatformUser.status` (pending →
  active → suspended? → offboarded). Enforced by
  `HasEmploymentLifecycle` trait + `PlatformUserObserver`.
- SOC 2 CC6.7 24h offboarding SLA. `RevokePlatformUserAccessJob` revokes all
  Sanctum PATs, adds JWT jtis to the deny-list cache, terminates active
  impersonation sessions, unregisters from on-call rotation.
- 90-day retention hold post-offboard. `PurgeOffboardedPlatformUsersJob`
  hard-deletes the PlatformUser + PlatformProfile rows after the hold,
  anonymising audit rows to `[REDACTED-PLATFORM-USER]` for compliance
  evidence retention.
- Audit-heavy `platform.audit` middleware writes correlation-id-linked audit
  + activity rows for every platform-plane mutation.
- On-call resolver with two backends: internal table (default) + PagerDuty
  REST API v2 (optional). `OnCallResolver::current()` + `::next()` cache
  results for 60s.
- Nine HTTP routes on the `platform_admin` guard, all under
  `/api/v1/platform/`.
- Fourteen permissions on the `platform_admin` guard, seeded across six
  roles (super_admin, ops, product, security, hr, compliance).
- Freshly-hired PlatformUsers land with ZERO role assignments — only
  `platform.platform_profiles.view.self` + `.update.self` seeded on every
  baseline role, so a new hire can read + write their own profile but
  nothing else.
- Four Academorix-internal capability entitlements: `platform.impersonate`,
  `platform.audit_read`, `platform.tenant_admin`, `platform.security_review`.
  Granted per-PlatformUser (not per-role) so revocation is granular.
- Three notifications: `PlatformUserHiredNotification`,
  `PlatformUserOffboardingScheduledNotification`,
  `PlatformUserOnCallEscalationNotification`. All `transactional_required`
  (opt-out not allowed).
- Eight lifecycle events: `PlatformUserHired`, `PlatformUserActivated`,
  `PlatformUserSuspended`, `PlatformUserRestored`, `PlatformUserOffboarded`,
  `PlatformProfileUpdated`, `PlatformUserManagerReassigned`,
  `PlatformUserDepartmentChanged`.
- Six Artisan commands: `platform-user:list`, `:describe`, `:hire`,
  `:offboard`, `:reassign-manager`, `:audit-report`. Mutating commands
  require `--reason=<text>` in staging + prod
  (`platform-user.commands.require_reason` config).
- Four validation rules: `valid_e164_phone`, `valid_iana_timezone`,
  `valid_department`, `manager_belongs_to_platform` (with cycle detection +
  depth cap).
- Zero tenancy hooks — deliberately empty (cross-plane by construction).
- Zero broadcast channels — Reverb subscriptions not applicable to
  platform-plane surface (foundation owns `platform.health`).
- Zero webhooks — no external integration party consumes the lifecycle
  events at this tier; documented as a future-work marker for HRIS / SCIM
  integration.
- One optional subprocessor: PagerDuty (workforce-management data only,
  never tenant data).
- Health probes: catalogue-seeded, MFA-coverage, manager-integrity,
  org-chart-cycles, on-call-resolver-reachable, offboarding-SLA-track,
  retention-hold-integrity, identity-uniqueness.
- Sixteen OpenTelemetry metrics under the `academorix.platform_user.*`
  namespace.
- Nine analytics events, routed to the internal (workforce) Segment source,
  never the tenant-facing product source.

### Compatibility

- Adds `foundation` + `identity` as hard dependencies.
- Wave 1a inception release. Extended by `access/rbac` (permissions +
  roles), `access/delegation` (impersonation sessions), and `auth` (login
  flow) in Wave 1b.
