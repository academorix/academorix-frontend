# platform-user

Academorix-staff principal. Wave 1a substrate for the `platform_admin` guard —
distinct from the `sanctum` guard that tenant Users use. One PlatformUser per
real Academorix employee.

## 1. What this module owns

| Concern                              | Owned artefact                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| Academorix-staff principal           | `PlatformUser` (identity_id + employment metadata: hire_date, department, employment_type, manager_id) |
| PII satellite (1:1)                  | `PlatformProfile` (first + last name, phone, avatar, timezone, Slack + GitHub handles)    |
| Employment lifecycle transitions     | `HasEmploymentLifecycle` trait (pending → active → suspended? → offboarded)               |
| Audit stamping (heavier than tenant) | `platform.audit` middleware                                                               |
| MFA enforcement                      | `platform.mfa_required` middleware                                                        |
| Offboarding revocation               | `RevokePlatformUserAccessJob` (24h SOC 2 SLA)                                             |
| Retention hold                       | `PurgeOffboardedPlatformUsersJob` (90-day hold + hard delete)                             |
| On-call resolver                     | `OnCallResolver` (internal table OR PagerDuty backend)                                    |
| Audit-report CLI                     | `platform-user:audit-report` command                                                      |

## 2. Design anchor — design.md §3 + §4.3

PlatformUser sits at the top of the identity tier's three-guard model:

- `identities` → global credential record (email + password + MFA)
- `users` → tenant-plane projection (`sanctum` guard, per-Application scope)
- `platform_users` → Academorix-staff projection (`platform_admin` guard,
  cross-plane by construction)
- `service_accounts` → machine-credential row (bearer / HS256 JWT)

The guard boundary is **inviolable** — a Sanctum PAT for a User never grants
platform_admin abilities, and vice versa. This is enforced at the auth-service
action layer + at every write path via `GuardMismatch` (422) on the RBAC
tables.

### Why platform_users is a distinct row from users

A single human at Academorix can be both an Academorix engineer (PlatformUser)
AND a tenant customer on one of Academorix's products (a User row in some
Application). The Identity substrate is shared — one email, one password, one
MFA secret. The **guard boundary** is what separates the two projections at
request time. A Sanctum PAT issued for the tenant-plane User never inherits
the platform_admin's abilities, even though both principals resolve through
the same Identity.

## 3. Column model

### `platform_users` (design.md §4.3)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | prefixed `plu_` |
| `identity_id` | uuid | FK identities.id, RESTRICT — UNIQUE (one PlatformUser per Identity) |
| `profile_id` | uuid | FK platform_profiles.id, RESTRICT — 1:1 |
| `status` | enum | pending / active / suspended / offboarded |
| `hire_date` | date | required |
| `offboarded_at` | timestamptz | nullable — populated on offboard |
| `offboarding_reason` | text | required on offboard (min 20 chars) |
| `department` | enum | ops / product / engineering / support / sales / finance / legal / security / dpo / hr |
| `employment_type` | enum | full_time / part_time / contractor / temporary |
| `job_title` | string | nullable |
| `manager_id` | uuid | self-referential FK, SET NULL on delete |
| `on_call_rotation_key` | string | nullable — opaque id for the on-call backend (PagerDuty schedule id or internal rotation table row id) |
| audit + timestamps + soft-delete | | |

**Never carries** `tenant_id` or `application_id` — cross-plane by design.

### `platform_profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | prefixed `plp_` |
| `first_name` | string | required (HR-controlled, not self-editable) |
| `last_name` | string | required (HR-controlled) |
| `display_name` | string | nullable, self-editable |
| `avatar_url` | string | nullable |
| `phone_e164` | string | required — on-call rotations need reachable phone |
| `slack_handle` | string | nullable — internal comms |
| `github_handle` | string | nullable — audit correlation for engineering staff |
| `timezone` | string | IANA identifier |
| audit + timestamps + soft-delete | | |

**PII cluster.** Redactor rules apply unless the caller has
`platform.platform_profiles.view.pii`.

## 4. Guard boundary + MFA gate

The `platform_admin` guard has ZERO opt-out on MFA. Two enforcement gates:

1. **Hire-time**: `PlatformUserObserver.creating` refuses to insert when the
   referenced Identity has NULL `mfa_secret_encrypted`. Error:
   `IDENTITY_MFA_REQUIRED`. Toggle-able via
   `platform-user.mfa.require_on_hire` (default on).
2. **Request-time**: `platform.mfa_required` middleware refuses any request
   where the authenticated PlatformUser's referenced Identity has NULL
   `mfa_secret_encrypted`. Handles the case where MFA was disabled after
   hire. Toggle-able via `platform-user.mfa.require_on_every_request`
   (default on).

Together these guarantee no non-MFA platform_admin session, ever.

## 5. Employment lifecycle

State machine on `PlatformUser.status`:

```
pending ──activate──▶ active ──suspend──▶ suspended
                       │                      │
                       │                      └─restore─▶ active
                       │
                       └──offboard──▶ offboarded (terminal)
```

- **pending**: hire completed, onboarding checklist in progress. Auto-promotes
  to active when checklist reports 100% complete (config toggle).
- **active**: normal operation. Every request on the platform_admin guard
  passes through fine.
- **suspended**: temporary. Access is revoked; impersonation sessions paused
  (not terminated); PagerDuty rotation membership stays but is skipped.
  Reversible via `restore`.
- **offboarded**: TERMINAL. All access revoked within 24h (SLA);
  impersonation sessions terminated; rotation membership unregistered. Row
  soft-deleted; 90-day retention hold; then hard-deleted by
  `PurgeOffboardedPlatformUsersJob`.

State transitions are enforced by `PlatformUserObserver` + refused with
`EMPLOYMENT_LIFECYCLE_TRANSITION_REFUSED` (422) on invalid transitions.

## 6. Offboarding SLA — SOC 2 CC6.7

The critical control. Timeline:

```
T=0h:  POST /platform-users/{id}/offboard
       ├─ status → offboarded
       ├─ deleted_at = now()
       └─ fires PlatformUserOffboarded event

T=0h+ε: DispatchRevokePlatformUserAccessJob (synchronous listener)
        └─ pushes RevokePlatformUserAccessJob → notifications-critical queue

T=0h→24h: RevokePlatformUserAccessJob runs
          ├─ deletes all Sanctum PATs (personal_access_tokens)
          ├─ adds outstanding JWT jtis to auth::JwtDenyList
          ├─ terminates active impersonation sessions
          ├─ unregisters from on-call rotation
          └─ emits academorix.platform_user.offboarding.access_revoked.duration_seconds

T=12h: half-SLA alert (if not yet complete) → PagerDuty page to on-call
T=24h: SLA breach alert (if not yet complete) → critical audit row + Slack alert to compliance

T=90d: PurgeOffboardedPlatformUsersJob (weekly cadence, ±7d)
        ├─ verify RevokePlatformUserAccessJob completed
        ├─ hard-delete PlatformUser + PlatformProfile
        └─ anonymise audit rows (user_id → [REDACTED-PLATFORM-USER])
```

## 7. Audit-heavy trail — SOC 2 CC7.2

The `platform.audit` middleware wraps every request on the platform_admin
guard. Every mutating request writes:

- 1× `platform_user.pii_access` activity_log row when the request unmuted PII
  (via `viewPii`, `viewHrContext`, or `viewOnCallPhone`).
- 1× `platform.request.audit` activity_log row on response emission
  (method, path, status, actor_id, correlation_id, duration_ms, IP truncated
  to /24).
- N× audit rows (one per Eloquent write via `HasAudit` trait — one row per
  mutated model).

Every row in the same request shares a **correlation_id** (UUID generated by
the middleware). The `platform-user:audit-report` command groups related
rows by correlation_id when rendering the PDF.

Retention: 365 days hot, 7 years cold (matches SOC 2 attestation windows).

## 8. On-call resolver

`OnCallResolver` is a service binding with two backends:

- **`internal`**: reads the `on_call_rotation_entries` table (owned by this
  module but populated per-environment by ops). Simple + free; suitable when
  Academorix has fewer than ~5 staff on rotation.
- **`pagerduty`**: calls the PagerDuty REST API v2 (`GET /oncalls?
  escalation_policy_id=<id>`). Preferred at scale. Adds ~200ms per uncached
  lookup; cache TTL 60s so a rotation change propagates within a minute.

Enable via `platform-user.on_call.enabled` (default off). When off,
`on_call_now()` returns null and `/on-call/current` returns a
`RESOLVER_DISABLED` shaped response.

## 9. Cross-tenant impersonation (Wave 1b link)

The future `access/delegation` module ships an `impersonation_sessions` table
that references `platform_users.id` as the `impersonator_platform_user_id`.
Every real-time act-as session for tenant support is a PlatformUser stepping
into a tenant User's shoes. The permission gate is the `platform.impersonate`
**entitlement** (see entitlements.json) — a per-PlatformUser boolean flag
granted by super_admin, NOT a role.

Impersonation sessions survive the impersonator's offboarding (compliance
evidence retention). The impersonator's PlatformUser row is hard-deleted
after the 90-day retention hold; the impersonation_sessions rows keep an
anonymised `impersonator_display_name` snapshot captured at session start
time.

## 10. What this module does NOT do

- **Doesn't own login** — that's `identity/auth`. This module owns the
  PlatformUser row; the auth module owns the flow that authenticates against
  it.
- **Doesn't own MFA enrolment** — that's `identity/mfa`. This module
  ENFORCES MFA existence at hire + at request time, but the enrolment /
  disable / regenerate flows live on the mfa module.
- **Doesn't own role assignments** — that's `access/rbac` (Wave 1b). Roles
  live on `platform_role_assignments` in that module. This module only ships
  the permission catalogue.
- **Doesn't own impersonation sessions** — that's `access/delegation` (Wave
  1b). This module ships the PlatformUser column that delegation FKs to.
- **Doesn't own tenant admin actions** — that's a domain-module concern
  (Tenancy, Application, per-App admin modules). This module ships the
  `platform.tenant_admin` entitlement that gates cross-tenant admin
  capabilities.

## 11. Cross-references

- `.kiro/specs/identity/design.md` §3 (principal architecture) + §4.3
  (`platform_users` shape) + §7 (auth flows) + §12 (non-goals)
- `.kiro/steering/hierarchy.md` §1a (canonical vocabulary — PlatformUser),
  §4 (two-audience boundary), §12 (service split — identity-service is
  SHARED)
- `.kiro/steering/tenancy-columns.md` §2 exception (platform_users has no
  tenant_id) + §5 (forbidden columns)
- `modules/identity/blueprints/identity/` — the Identity substrate this
  module builds on
- `modules/identity/README.md` — module tier index

