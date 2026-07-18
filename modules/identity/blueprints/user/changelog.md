# user \u2014 changelog

## [Unreleased] \u2014 inception (Wave 1a of the identity tier)

- User module authored. Three entities: `User`, `Profile`, `TenantMember`.
- Domain-agnostic `ProvisionUser` action \u2014 creates a User from an existing
  Identity + Application + Tenant + initial role + Profile data. Consumed by
  invitation acceptance, self-registration, admin creation, imports.
- Lifecycle transitions: `activate` / `suspend` / `restore` / `erase`, wired to
  the twelve lifecycle events (see `events.json`).
- Async provisioning path via `ProvisionUserJob` when the caller kicks off from
  a queue worker (invitation retry, delayed SSO grant exchange).
- Self-service `/api/v1/me` surface \u2014 the SPA's bootstrap manifest
  (identity + user + profile + roles + permissions + features + terminology +
  memberships). Cached briefly with an aggressive invalidation matrix.
- Profile PII cluster + redactor pipeline. `profile.view.pii` gates adult PII;
  `profile.view.pii.child` gates minor PII AND requires a live
  `AthleteGuardian` relationship (Wave 7).
- Avatar upload pipeline via `POST /me/avatar`. Multipart; JPEG / PNG / WEBP
  only; per-tier size caps via the `avatar_upload` entitlement.
- Multi-tenant memberships via `TenantMember` pivot. `is_default` enforced by
  observer + partial unique index. Cross-application memberships refused with a
  hard 422.
- `/me/tenants/{tenant}/switch` for the tenant-switcher UX. Sanctum PAT
  claims either re-issued or rotated per `auth::session.rotate_on_tenant_switch`
  config.
- Row-level ownership via the shipped `ScopeSuffixResolver` service \u2014 base
  repositories consume it at query build time. Suffixes `.own`, `.tenant`,
  `.branch`, `.team`, `.child`, `.any` mapped to WHERE clauses.
- Compliance floors wired: `AgeMeetsMin` validation rule composes COPPA (US) +
  GDPR (per-country) + tenant setting; PII redactor + minor-visibility policy
  gated by compliance.coppa / compliance.gdpr flags.
- GDPR Art. 17 erasure timeline \u2014 30d hold (up to 90d per tenant setting),
  `PurgeErasedUsersJob` finalises after the window.
- Batched last-active-at updates via `UpdateLastActiveJob` \u2014 buffered in
  Redis, flushed to DB every 60s.
- Notifications: `UserProvisionedNotification`, `UserSuspendedNotification`,
  `UserAddedToTenantNotification`, `UserRemovedFromTenantNotification`,
  optional `ProfileUpdatedConfirmationNotification`.
- Analytics: 9 Segment `track` events. `user_id` (ULID) is the anonymised
  identifier; `email` + phone are never Segment properties.
- Entitlements published: `multi_tenant_membership`, `custom_display_name`,
  `avatar_upload`, `profile_i18n_override`, `bulk_user_provision`.
- Feature keys published: `user.core`, `user.multi_tenant`,
  `user.avatar_upload`, `user.locale_override`, `user.bulk_invite`,
  `user.athlete_portal`, `user.profile_update_confirmation`,
  `user.gdpr_erasure_ui`.
- Platform-admin surface for cross-tenant read (`/api/v1/platform/users`).
  Writes stay on the tenant surface \u2014 platform ops must impersonate an
  admin (via `access::delegation` in Wave 1b) to write.
- ULID prefixes reserved: `usr_` (User), `prf_` (Profile), `tmb_`
  (TenantMember). Foundation registry updated in the same commit.
- Two tenancy hooks: `SeedOwnerMembershipOnTenantProvisioned` +
  `TenantMembersOnTenantErased` so the User <-> Tenant relationship survives
  tenant lifecycle transitions.

### Compatibility

- Depends on `foundation`, `identity`, `application`, `tenancy`.
- Extended by `auth`, `access`, `sports` (Wave 7), `staff` (Wave 7).
- Ships alongside the identity + application scaffolding \u2014 the three
  modules must land together for provisioning to work end-to-end.

### Non-goals for this release

Every non-goal below stays out of this module and is explicitly deferred to a
sibling. See `readme.md` \u00a77 for the full list.

- No login / MFA / refresh / logout \u2014 owned by `identity/auth/`.
- No JWT signing / JWKS \u2014 owned by `identity/auth/`.
- No SSO / SAML / OIDC \u2014 deferred to `identity/sso/` (Wave 1c).
- No SCIM auto-provisioning \u2014 deferred.
- No delegated authentication (support-agent-impersonates-user) \u2014 lives in
  `access/delegation/` (Wave 1b).
- No RBAC vocabulary \u2014 roles + permissions come from `access/rbac/`.
