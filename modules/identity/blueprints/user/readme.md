# user

Per-Application projection of an Identity. Owns the `User` principal, its 1:1
`Profile` satellite, and the `TenantMember` pivot that lets one User participate
in multiple Tenants within the same Application. Wave 1a of the identity tier
(priority 18).

## 1. What this module owns

| Concern                              | Owned artefact                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Per-Application principal            | `User` (`users.identity_id` \u00d7 `users.application_id` \u00d7 `users.tenant_id`)                     |
| PII cluster                          | `Profile` (1:1 with User, redactor-gated)                                                               |
| Multi-tenant membership              | `TenantMember` (pivot User \u2194 Tenant + role)                                                        |
| Provisioning action                  | `ProvisionUser` (domain-agnostic; consumed by invitations, self-registration, admin creation, imports) |
| Lifecycle transitions                | activate / suspend / restore / erase, plus the scheduled `PurgeErasedUsersJob`                          |
| Self-service surface                 | `/me`, `/me/profile`, `/me/avatar`, `/me/tenants`, `/me/tenants/{tenant}/switch`                        |
| Admin surface                        | Full CRUD on `users`, per-user membership management                                                    |
| Platform-admin surface               | Cross-tenant read (`/api/v1/platform/users`) for support tooling                                        |
| `.own` scope resolver                | Ships the substrate consumed by every base repository at query time                                     |
| Compliance floors                    | Age gate at provisioning + PII redactor + GDPR erasure timeline                                         |

### 1.1 The Identity / User / TenantMember split

One `Identity` per real human across every Application. One `User` per
`(Identity \u00d7 Application)`. One or more `TenantMember` rows per `User`,
each granting access to a Tenant within the same Application.

```
identities                users                    tenant_members
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500          \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500        \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
id (idn_...)              id (usr_...)              id (tmb_...)
email                     identity_id \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510      user_id
password_hash             application_id  \u2502      tenant_id
mfa_secret                tenant_id (home)\u2502      role_id
                          profile_id       \u2502      is_default
                          status           \u2502      is_staff_only
                          last_login_at    \u2502      joined_at
                                           \u2502      last_active_at
                                           \u2502
                          profiles         \u2502
                          \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 \u2502
                          id (prf_...) \u2500\u2500\u2500\u2500\u2518
                          first_name / last_name
                          display_name
                          avatar_url
                          phone_e164
                          locale / timezone / dob
```

The three tables answer three different questions:

- **`identities`** \u2014 _who is this human?_ (global)
- **`users`** \u2014 _how does this human show up on Application X?_ (per-App)
- **`tenant_members`** \u2014 _which Tenants inside Application X can this User
  work in, and as what role?_ (per-(User, Tenant))

## 2. The `ProvisionUser` action \u2014 domain-agnostic

The action signature does not know anything about athletes, coaches, admins, or
receptionists. It takes an Identity, an Application, a Tenant, an initial role,
and optional Profile data, and it produces a new User \u2014 no more, no less.

```php
$user = app(UserProvisioner::class)->provision(
    identity: $identity,
    application: $application,
    tenant: $tenant,
    initialRole: $role,           // access::Role
    profileData: new ProfileData(
        firstName: 'Sam',
        lastName: 'Rivera',
        dob: '1988-04-12',
        timezone: 'America/New_York',
    ),
    source: 'invitation',
    provisionedBy: $currentAdmin, // nullable
);
```

Domain modules layer on top:

- **`sports/athletes/LinkAthleteToUser`** (Wave 7) \u2014 sets
  `athletes.user_id` AFTER `ProvisionUser` succeeds. The user module NEVER
  touches `athletes.*`.
- **`sports/coaching/PromoteUserToCoach`** (Wave 7) \u2014 creates the `coaches`
  row referencing the User.
- **`staff/hires/HireStaffFromUser`** (Wave 7) \u2014 creates the `staff` row.

This is why the athlete-with-login flow (design.md \u00a75) works cleanly \u2014
the athlete row's `user_id` is nullable, so:

- **Minor athlete (5-12yo)** \u2014 no `User` at all; guardians hold the roles.
- **Teen athlete (13-17yo)** \u2014 `ProvisionUser` runs like any other flow;
  `LinkAthleteToUser` runs after.
- **Adult athlete (18+)** \u2014 same as teen; guardian rows are soft-deleted at
  the adult transition age via `sports::athletes:process-age-transitions`.

The user module does not know about any of that. It provisions.

## 3. Row-level ownership \u2014 the `.own` scope resolver

The user module ships the `ScopeSuffixResolver` service (consumed by every base
repository across every module) that parses permission suffixes and yields the
matching WHERE clause.

The convention: a permission ending in `.own` implies
`WHERE resource.user_id = current_user_id`. So a caller carrying
`athletes.view.own` sees ONLY the Athlete rows they directly own via
`athletes.user_id`. Same for `.tenant`, `.branch`, `.team`, `.child`,
`.any` \u2014 each suffix maps to a filter pattern.

See `permissions.json` for the full suffix taxonomy + example seed lists per
role.

## 4. Multi-tenant memberships

A User with the `multi_tenant_membership` entitlement (medium tier +) can hold
`TenantMember` rows in multiple Tenants of the same Application. The tenant
switcher UI reads `/me/tenants` and posts to `/me/tenants/{tenant}/switch` to
change the active tenant for the current session.

Constraints:

- **Same Application only.** A TenantMember row where
  `tenant.application_id \u2260 user.application_id` is refused with
  `TENANT_MEMBERSHIP_CROSS_APPLICATION` (422).
- **Exactly one default.** The observer enforces the invariant. Attempting to
  remove the default without promoting another fails with
  `TENANT_MEMBERSHIP_LAST_DEFAULT` (409).
- **Sanctum PAT scoped to (User, Tenant).** Switching tenants either revalidates
  the existing PAT with the new tenant claim OR issues a fresh PAT \u2014
  behaviour configured via `auth::config.session.rotate_on_tenant_switch`.

## 5. PII redactor

Every Profile field except `id`, `display_name`, `avatar_url`, `locale`,
`timezone` is subject to the redactor.

- **Adult subjects** \u2014 non-subject callers see the redacted response unless
  they carry `profile.view.pii`.
- **Minor subjects** \u2014 non-subject callers see the redacted response unless
  they carry `profile.view.pii.child` AND (a) they are the subject's guardian
  via `AthleteGuardian`, OR (b) they are an admin with an explicit tenant
  policy allowing the read.

The subject always sees their own Profile unredacted.

## 6. Lifecycle timeline

```
[created]  status=pending
    \u2193 (email verification OR admin approval)
[active]   full access
    \u2193 (admin suspend)          \u2193 (self-erasure OR admin delete)
[suspended]                       [soft-deleted]  deleted_at set
    \u2193 (admin restore)                \u2193 (erasure hold window expires \u2014 default 30d)
[active]                          [hard-deleted]  fires UserHardDeleted
                                  \u2193 (Identity may live on for other Apps)
                                  Profile hard-deleted
                                  TenantMember rows cascade-deleted
```

Retention is documented per-row in `retention.json`. Compliance evidence lives
in `compliance.json`.

## 7. What this module does NOT do

- **Doesn't authenticate.** Login / MFA / refresh / logout live in
  `identity/auth/`. This module only ships the User principal + provisioning.
- **Doesn't own Sanctum PAT storage.** `personal_access_tokens` is Sanctum's own
  table; the auth module wires it. This module composes `HasApiTokens` on the
  User model.
- **Doesn't own JWTs.** `identity/auth/` mints them.
- **Doesn't know about athletes.** The `Athlete.user_id` linkage is set by the
  future `sports/athletes/` module.
- **Doesn't own the RBAC vocabulary.** Roles + Permissions live in
  `access/rbac/`. This module ships policies + permissions but the words come
  from Access.
- **Doesn't ship the /login endpoint.** That's `identity/auth/`.
- **Doesn't federate identities across identity providers.** SSO lands in
  `identity/sso/` in Wave 1c.

## 8. Cross-references

- `.kiro/specs/identity/design.md` \u00a74.2 \u2014 users table shape
- `.kiro/specs/identity/design.md` \u00a74.5 \u2014 profiles table shape
- `.kiro/specs/identity/design.md` \u00a74.6 \u2014 tenant_members table shape
- `.kiro/specs/identity/design.md` \u00a75 \u2014 athletes-as-principals flow
- `.kiro/specs/identity/design.md` \u00a76 \u2014 configuration model
- `.kiro/specs/identity/design.md` \u00a79 \u2014 `.own` scope pattern
- `.kiro/specs/identity/design.md` \u00a712 \u2014 non-goals
- `.kiro/steering/hierarchy.md` \u00a71 \u2014 canonical vocabulary for User vs
  Identity vs TenantMember
- `.kiro/steering/hierarchy.md` \u00a73 \u2014 Identity / User split (D1)
- `.kiro/steering/tenancy-columns.md` \u00a72 \u2014 the eight rows carrying
  `application_id` (users is one of them)
- `modules/identity/README.md` \u2014 module tier index
