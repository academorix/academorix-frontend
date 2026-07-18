# Implementation Plan: SSO / SAML / OIDC federation

## Overview

Tenant-scoped Single Sign-On for the Academorix dashboard. Enterprise customers
land on their existing Identity Provider (Okta, Azure AD, Google Workspace,
Auth0) and get provisioned into the workspace via JIT (Just-In-Time) claim
mapping instead of managing a second password.

Two federation protocols supported:

- **SAML 2.0** — enterprise IdPs (Okta, Azure AD, ADFS, Auth0).
- **OIDC / OAuth 2.0** — Google Workspace, Microsoft 365, Okta, any OP that
  publishes an OIDC discovery document.

Every tenant can enrol **N IdPs** and mark one as **primary**. Sign-in routes
non-federated users through email + password as usual; users whose email domain
matches a configured IdP get bounced to their IdP transparently ("Enterprise SSO
— sign in with Okta").

### Locked decisions

- **JIT vs. invite** — auto-create when the email domain matches a configured
  IdP with `allow_jit: true`; block otherwise. Per-IdP toggle stored on
  `TenantIdentityProvider.allow_jit`.
- **Role claim mapping** — mapping table (`jit_role_map` JSON column on the IdP
  model) that translates IdP-native role names to Academorix Spatie role names.
- **Session TTL for SSO users** — honour the IdP's `NotOnOrAfter` claim when
  present, fall back to Sanctum's `expiration` config.
- **SAML package** — `slides/laravel-saml2` (an `onelogin/php-saml` wrapper —
  recently maintained; the original `aacotroneo/laravel-saml2` is stale).
- **Tenant-slug routing** — `/api/sso/{slug}/*` mounts on the **central** `api`
  middleware group with a `ResolveTenantFromSlug` middleware that calls
  `tenancy()->initialize($tenant)` — IdPs get a stable ACS URL without
  per-tenant subdomain configuration.

### Non-goals

- **Federation between Academorix tenants** — one tenant's SSO doesn't grant
  access to another tenant.
- **Legacy SAML 1.1 support** — SAML 2.0 only.
- **Self-service IdP provisioning by non-admins** — only tenant owners + admins
  with `settings.manage_sso` can add/edit/delete IdPs.

### Backend endpoint surface

| Method + path                                       | Purpose                                              |
| --------------------------------------------------- | ---------------------------------------------------- |
| `POST /api/sso/lookup`                              | Email → IdP redirect URL for domain-sniffing         |
| `POST /api/sso/{slug}/saml/initiate`                | Start SAML SP-initiated login                        |
| `POST /api/sso/{slug}/saml/acs`                     | Consume SAML AuthnResponse                           |
| `GET /api/sso/{slug}/saml/metadata`                 | SP metadata for IdP admins                           |
| `POST /api/sso/{slug}/oidc/initiate`                | Start OIDC auth code flow                            |
| `GET /api/sso/{slug}/oidc/callback`                 | Consume OIDC code                                    |
| `POST /api/auth/sso/exchange`                       | Trade a one-time SSO handoff token for a Sanctum PAT |
| `GET /api/v1/tenancy/identity-providers`            | Admin CRUD listing                                   |
| `POST /api/v1/tenancy/identity-providers`           | Admin create                                         |
| `PATCH /api/v1/tenancy/identity-providers/{id}`     | Admin update                                         |
| `POST /api/v1/tenancy/identity-providers/{id}/test` | Trigger a self-test                                  |
| `DELETE /api/v1/tenancy/identity-providers/{id}`    | Admin delete                                         |

## Tasks

### Phase A — foundation

- [x] 1. Backend: add `slides/laravel-saml2` to `modules/Sso/composer.json`;
      `laravel/socialite` is already present at the root. Composer-merge-plugin
      picks it up.
- [x] 2. Backend: scaffold `modules/Sso/` following the `modules/Auth/` shape —
      `Contracts/`, `Data/`, `Controllers/`, `Repositories/`, `Services/`,
      `Policies/`, `Providers/`, `Http/Middleware/`, `Actions/`, `Exceptions/`,
      `Observers/`, `Events/`, `routes/{central,platform,tenant}.php`,
      `database/migrations/`, `tests/{Feature,Unit}/`.
- [x] 3. Backend: migration `tenant_identity_providers` table with columns
      `tenant_id`, `protocol` (enum: saml|oidc), `name`, `email_domain`,
      `is_primary`, `allow_jit`, `issuer_url`, `sso_url`, `sp_entity_id`,
      `x509_cert` (encrypted), `discovery_url`, `client_id`, `client_secret`
      (encrypted), `scopes` (JSON), `jit_role_map` (JSON), `health_status`,
      `health_checked_at`, `cert_expires_at`, `created_by`, `updated_by`,
      `deleted_by`, timestamps, soft-deletes. Unique index on
      `(tenant_id, email_domain)`.
- [x] 4. Backend: `TenantIdentityProvider` Eloquent model with
      `BelongsToTenant`, `Userstamps`, `HasUuids`, `implements Auditable` +
      `use Auditable` (owen-it/laravel-auditing). Encrypted casts on `x509_cert`
      and `client_secret`.
- [x] 5. Backend: `TenantIdentityProviderData` output DTO (spatie/laravel-data)
      with `#[MapOutputName(SnakeCaseMapper)]`. X509 cert and client_secret
      redacted in output (return `hasX509Cert: bool` and `hasClientSecret: bool`
      instead).
- [x] 6. Backend: `UpsertTenantIdentityProviderData` input DTO with validation —
      protocol enum, URL format on issuer/sso/discovery URLs, email domain
      regex, primary-uniqueness custom rule.
- [x] 7. Backend: `TenantIdentityProviderPolicy` gating
      create/update/delete/test on the `settings.manage_sso` permission.
- [x] 8. Backend: `TenantIdentityProviderObserver` that writes audit rows on
      create/update/delete via `AuthEventAuditor` and enforces the "only one
      primary per tenant" invariant (unset previous primary in a DB
      transaction).
- [x] 9. Backend: `ResolveTenantFromSlug` middleware that pattern-matches the
      `{tenant_slug}` route parameter using the same regex as
      `WorkspacePreviewController`, looks up the tenant, and calls
      `tenancy()->initialize($tenant)`. Register as middleware alias
      `sso.tenant`.
- [x] 10. Backend: `SsoServiceProvider` extending
      `AbstractModuleServiceProvider` with declarative `$bindings`,
      `$singletons`, `$policies`, `$listeners`, `$contributors` (SsoPermissions
      bundle), middleware alias registration via `RegistersMiddlewareAliases`.
- [x] 11. Backend: `SsoRouteServiceProvider` mounts `routes/central.php` (public
      SSO endpoints under `/api/sso` with `sso.tenant` middleware on `{slug}`
      routes), `routes/platform.php` (admin CRUD under
      `/api/v1/tenancy/identity-providers`), and `routes/tenant.php` (the
      `/api/auth/sso/exchange` endpoint on the tenant surface).
- [x] 12. Backend: `SsoPermissions` contributor registers the
      `settings.manage_sso` permission on the Access module's permission tree
      via the `ContributorTag::PERMISSIONS` slot.
- [x] 13. Frontend: extend `Identity.features` handling in
      `src/refine/identity-store.ts` so `sso_enabled` is a first-class
      capability flag exposed via `useGetIdentity()`. Add a
      `useHasFeature("sso_enabled")` helper for consumers.
- [x] 14. Frontend: add `src/refine/data/identity-providers.json` fixture with
      2-3 sample IdP rows (one SAML Okta, one OIDC Google Workspace, one primary
      flag toggled). Register the `identity-providers` resource in
      `src/refine/data-provider.ts` datasets map.

### Phase B — SP-initiated SAML

- [x] 15. Backend: `SsoLookupController@store` — POST `/api/sso/lookup` accepts
      `{email}`, extracts the domain, queries `TenantIdentityProvider` for a
      matching row across tenants (no tenancy scope — needs a scoped raw query
      with an explicit `whereNull('deleted_at')`), returns
      `{sso_url?, protocol?, tenant_slug?}` or 200 with an empty envelope on
      miss. Never 404 (would leak enrolment). Rate-limit by IP.
- [x] 16. Backend: `SamlInitiateController@store` — POST
      `/api/sso/{slug}/saml/initiate` builds the `AuthnRequest` via the
      `slides/laravel-saml2` service class configured with the tenant's
      `TenantIdentityProvider`, returns `{sso_url, request_id}` for the SPA to
      redirect to. Persists the request id in a `sso_auth_requests` cache entry
      (60s TTL) for relay-state validation.
- [x] 17. Backend: `SamlAcsController@__invoke` — POST
      `/api/sso/{slug}/saml/acs` validates the signed SAML response against the
      IdP's X.509 certificate, verifies the `InResponseTo` matches a recorded
      request id, extracts claims, resolves the tenant user (email match via
      `UserRepository::findByEmail` or JIT create via `JitProvisionUser`), mints
      a short-lived (60s) SSO handoff token, redirects to
      `https://{slug}.academorix.com/sso/callback?token=…`. Fail-closed on every
      validation error.
- [x] 18. Backend: `SamlMetadataController@__invoke` — GET
      `/api/sso/{slug}/saml/metadata` returns the SP metadata XML that IdP
      admins upload on their side. Content-Type `application/samlmetadata+xml`.
- [x] 19. Backend: `JitProvisionUser` action — email + claims → new tenant User.
      Skips password, marks `email_verified_at = now()`, applies role from
      `jit_role_map[$claim] ?? $tenant->default_new_user_role`, uses Fortify's
      `CreatesNewUsers` under the hood so the same registration lifecycle events
      fire. Audit event `sso_jit_created`.
- [x] 20. Backend: `MintSsoHandoffToken` action — issues a one-time-use PAT via
      `IssueAccessToken` with a 60-second TTL and the single ability
      `sso.exchange`. Persists the token id in a `sso_handoff_tokens` table with
      a `consumed_at` nullable column for one-shot redemption.
- [x] 21. Backend: `SsoExchangeController@store` — POST `/api/auth/sso/exchange`
      accepts the handoff bearer, validates the `sso.exchange` ability, marks
      the handoff row consumed in a DB transaction (SELECT FOR UPDATE), issues a
      proper long-lived Sanctum PAT via `IssueAccessToken` +
      `TokenAbilitiesResolver`, revokes the handoff token, returns an
      `AuthTokenData` envelope. Rejects re-use with 401.
- [x] 22. Backend: feature tests for the full SAML flow — valid response,
      invalid signature (fail-closed), expired assertion, replay (`InResponseTo`
      mismatch), JIT create success, JIT block when `allow_jit: false`, handoff
      token single-use enforcement.

### Phase C — OIDC

- [x] 23. Backend: `OidcInitiateController@store` — POST
      `/api/sso/{slug}/oidc/initiate` builds the authorization URL via
      Socialite's stateless flow with a per-request PKCE challenge + `state`
      nonce cached against the tenant (60s TTL). Returns
      `{authorization_url, state}`.
- [x] 24. Backend: `OidcCallbackController@__invoke` — GET
      `/api/sso/{slug}/oidc/callback` validates `state` against the cache,
      exchanges the code for tokens, verifies the `id_token` signature (JWKS
      lookup against `discovery_url`), verifies `aud == client_id` and
      `iss == configured issuer`, verifies `nonce` matches, resolves the tenant
      user (email match or JIT create), mints a handoff token, redirects to
      `/sso/callback?token=…`. Fail-closed on every check.
- [x] 25. Backend: `SocialiteOidcProviderFactory` — per-IdP Socialite driver
      registration keyed by `TenantIdentityProvider.id`. Supports both "public"
      (Google, Microsoft) and "private" (Okta, Auth0) configurations via the
      `discovery_url` + `client_id` + `client_secret` + `scopes` tuple.
      Discovery document cached per IdP for 24h.
- [x] 26. Backend: feature tests for OIDC — valid `id_token`, invalid signature
      (fail-closed), issuer mismatch, audience mismatch, `state` replay, missing
      `nonce`, JIT provisioning success and block paths, discovery-URL cache
      hit + miss.

### Phase D — admin UI

- [x] 27. Frontend: add `sso` entry to
      `src/modules/settings/settings.sections.ts` (`group: "advanced"`,
      `icon: "key"`, `label: "Single sign-on"`,
      `description: "Identity providers and JIT provisioning."`).
- [x] 28. Frontend: `src/modules/settings/pages/sso/sso-page.tsx` — top-level
      page rendered inside `<SettingsPageShell>`. Uses Refine's
      `useList({resource: "identity-providers"})` to render an IdP table with
      add / edit / test / delete row actions. Columns: name, protocol,
      email_domain, is_primary badge, health_status badge, cert_expires_at
      (highlighted if <30d), row menu.
- [x] 29. Frontend: `AddSamlProviderWizard` — 3-step modal: (1) upload IdP
      metadata XML (drops a file, backend parses fields) OR paste fields
      manually (`issuer_url`, `sso_url`, `x509_cert`), (2) map role claims via a
      key-value editor, (3) test the flow — POSTs to
      `identity-providers/{id}/test` and displays a stream of check results.
- [x] 30. Frontend: `AddOidcProviderWizard` — 3-step modal: (1) discovery URL
      (backend fetches and validates), (2) client_id / client_secret + scopes
      multi-select, (3) test the flow.
- [x] 31. Backend: `IdentityProviderController` — admin CRUD under
      `/api/v1/tenancy/identity-providers` returning
      `TenantIdentityProviderData` envelopes; uses the Foundation `ApiResponses`
      envelope shape (`{data, message, status, meta}`) since this is CRUD, not
      auth.
- [x] 32. Backend: `IdentityProviderTestController@__invoke` — POST
      `/api/v1/tenancy/identity-providers/{id}/test` executes a dry-run probe
      (metadata fetch + cert validation for SAML, discovery-URL fetch + JWKS
      parse for OIDC) and returns
      `{ok: bool, checks: [{name, ok, message}, ...]}`. Doubles as the
      health-check core so the scheduler and the UI test button share code.
- [x] 33. Backend: `SsoHealthCheckCommand` (`sso:health-check`) +
      `Console\Kernel` schedule at `->everySixHours()` — polls each IdP's
      metadata/discovery URL, writes `health_status` + `cert_expires_at` back to
      the row. Emits a `SsoIdpCertificateExpiring` domain event when a cert
      expires within 30 days; Communication routes the notification to owner +
      admins.

### Phase E — sign-in UX

- [x] 34. Frontend: modify `src/modules/auth/pages/sign-in.tsx`
      `handleEmailSubmit` — POST the trimmed email to `authApi.ssoLookup(email)`
      first. If the response includes `sso_url`,
      `window.location.assign(sso_url)` (full page redirect — the IdP flow needs
      to leave the SPA). Otherwise fall through to the existing password step.
      Show a spinner during the lookup; timeout after 3s to avoid stalling on a
      slow backend.
- [x] 35. Frontend: extend `SignInAlternatives` with a "Sign in with SSO" button
      — visible when the tenant has any enrolled IdP (gated on
      `useHasFeature("sso_enabled")`). Clicking it POSTs to
      `/api/sso/{slug}/saml/initiate` (or `/oidc/initiate`) on the primary IdP
      and redirects; opens a lightweight IdP picker modal if the tenant has more
      than one IdP configured. IdP branding (name + logo) sourced from the
      identity-providers fixture.
- [x] 36. Frontend: `/sso/callback` route + page —
      `src/modules/auth/pages/sso-callback.tsx`. Reads the one-time token from
      the URL fragment, calls `POST /api/auth/sso/exchange`, writes the returned
      Sanctum PAT via `writeAuthToken` + `writeCachedUser`, calls
      `refreshIdentity`, navigates to `/dashboard`. Renders a spinner while
      exchanging. On failure renders an error card with a "Return to sign-in"
      link and the underlying error message.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": [1, 2, 3, 12]
    },
    {
      "wave": 2,
      "tasks": [4, 9]
    },
    {
      "wave": 3,
      "tasks": [5, 6, 7, 8]
    },
    {
      "wave": 4,
      "tasks": [10, 11, 13, 14]
    },
    {
      "wave": 5,
      "tasks": [15, 16, 18, 19, 20, 23, 25]
    },
    {
      "wave": 6,
      "tasks": [17, 21, 24]
    },
    {
      "wave": 7,
      "tasks": [22, 26]
    },
    {
      "wave": 8,
      "tasks": [27, 31, 32, 33]
    },
    {
      "wave": 9,
      "tasks": [28, 34]
    },
    {
      "wave": 10,
      "tasks": [29, 30, 35, 36]
    }
  ],
  "notes": "Phase F (SLO + SCIM) is intentionally excluded from the graph — deferred per the spec's own note."
}
```

## Notes

- Every task lands in its own commit with a Conventional Commits message
  referencing the task number (e.g.
  `feat(sso): task 4 add TenantIdentityProvider model`).
- Every new file gets a full class-level PHPDoc with `@param` / `@return` /
  `@throws` per `#coding-standards`.
- Fail-closed on every signature-verification and token-exchange path —
  swallowing an exception here would be a security bug.
- Attribute names, ability strings, event names, permission keys, and audit
  event names must be `ATT_*` interface constants (Magento-2 style) — no magic
  strings.
- Every test file uses the Foundation-mandated fakes (`Http::fake()`,
  `Storage::fake()`, `Persona::fake()` where relevant).
- The SPA fixture path (`data/identity-providers.json`) must match the backend's
  snake_case output shape so swapping the fixture provider for the real HTTP
  provider is a config change, not a code change.
- Phase F tasks are intentionally excluded from this file per the spec's own
  "nice-to-have, defer" instruction. Add them in a follow-up spec when the
  scoping conversation is ready.

## Estimated timeline

- Phase A: 2-3 dev-days
- Phase B: 3-4 dev-days
- Phase C: 2 dev-days
- Phase D: 2 dev-days
- Phase E: 1 dev-day
- **Total**: ~10-12 dev-days for a production-ready SSO story.
