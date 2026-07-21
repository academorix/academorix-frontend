# ADR 0025 — Integrations two-lane model: providers now, marketplace apps later

**Status:** Accepted **Date:** 2026-07-15 **Deciders:** Product + backend team

## Context

Every serious B2B SaaS platform integrates with the tenant's existing tool stack
(Stripe, HubSpot, Twilio, Zoom, Mailchimp, Google Calendar, ...). The question
of _how_ integrations plug in falls into two clearly different categories that
get routinely conflated:

1. **Native provider integrations** — a fixed allowlist of vendors we integrate
   with. Tenants pick from a menu, paste credentials, done. The integration code
   lives inside the platform. No third-party code, no sandboxing concern, no
   billing rails to build.

2. **Marketplace apps** (Shopify Apps, Salesforce AppExchange, Slack Directory,
   HubSpot App Marketplace) — third parties build apps, tenants install them, we
   take a revenue share. Requires developer platform, OAuth 2.0 client rows per
   app, scoped permissions, sandboxed iframe / module federation extension
   points, per-app billing + revenue-share plumbing, app review team, developer
   docs, ecosystem marketing.

For Stackra specifically:

- **Native providers are needed on day one.** Stripe billing (already shipped),
  Paddle, Pipedrive / HubSpot for the enrollment funnel sync (ADR 0024), Apple
  Wallet + Google Wallet (already shipped via `spatie/laravel-mobile-pass`),
  Twilio for SMS, Zoom for online sessions, Google Calendar / Outlook for coach
  schedules, Slack for admin notifications.
- **Marketplace apps carry serious risk.** Every third-party app has access to
  tenant data — which for us includes **minors' PII** under COPPA / GDPR child
  protection rules. We become liable for their handling. App review processes at
  Shopify + Salesforce cost tens of millions per year. Legitimate concern:
  launching a marketplace before we have a mature compliance team is genuinely
  dangerous.
- **But the DATA MODEL that supports marketplace should exist from day one.**
  Retrofitting OAuth 2.0 clients, install grants, scoped permissions, and
  webhook subscriptions after the fact is much harder than declaring the shape
  now and leaving the marketplace unpublished.

The current `platform/integrations` module ships one entity — a
`TenantIntegration` — with a free-form provider slug and encrypted credentials
JSON. That works for the top-three integrations but does not scale to a
marketplace and does not enforce provider allowlisting.

## Options considered

1. **Ship marketplace apps on day one (rejected — dangerous).** Twelve to
   eighteen months of platform work + minors'-data liability risk. No ecosystem
   to launch into.
2. **Never build the marketplace substrate (rejected — 3-year retrofit).** The
   three-year cost of not modelling apps up front is a full data-model migration
   through every consumer package. Every "why isn't there a third-party
   integration" ticket compounds the pressure.
3. **Two lanes: providers ship now, apps modelled but unpublished (chosen).**
   Provider allowlist for the native integrations we actively support; `App` +
   `AppInstallation` + `AppWebhookSubscription` entities modelled from day one
   but no marketplace UI, no third-party developer program. When the platform is
   ready to publish (2027+), the schema is already there.

## Decision

### D1 — Lane 1: provider slots (ships now)

The `platform/integrations` module gains an `IntegrationProvider` entity (`ipd_`
ULID prefix) — the allowlist catalog of every provider Stackra supports.
System rows only; adding a provider is a code deploy.

**Shape:**

```
IntegrationProvider
├── id                      ULID (ipd_...)
├── slug                    'stripe' | 'paddle' | 'pipedrive' | 'hubspot' | ...
├── name                    display name
├── kind                    'payment' | 'crm' | 'email' | 'sms' | 'calendar'
│                         | 'chat' | 'wallet' | 'accounting' | 'webhook'
│                         | 'sso' | 'video' | 'storage'
├── auth_kind               'oauth2' | 'api_key' | 'basic' | 'webhook_only'
├── scopes                  jsonb array of scope strings the provider supports
├── webhook_events          jsonb array of event names the provider emits
├── is_system               boolean — always true for allowlist rows
├── enabled                 boolean — soft disable a provider tenant-wide
├── docs_url                string — link to the provider's own docs
├── logo_url                string
└── config_schema           jsonb — JSON schema for TenantIntegration.config
```

Discovery: PHP `#[AsIntegrationProvider(kind: 'crm', slug: 'pipedrive')]`
attribute on a class implementing `IntegrationProviderInterface` — the provider
class self-registers into `IntegrationProviderRegistry` at boot via Foundation's
`DiscoversAttributes`. The seeder walks discovered providers + upserts the
`integration_providers` rows.

**Provider class contract:**

```php
interface IntegrationProviderInterface
{
    public function configureCredentials(array $input): TenantIntegrationCredentials;
    public function verifyConnection(TenantIntegrationCredentials $credentials): bool;
    public function sync(TenantIntegration $integration, SyncContext $context): SyncResult;
    public function verifyWebhookSignature(Request $request, TenantIntegration $integration): bool;
    public function handleWebhook(WebhookPayload $payload, TenantIntegration $integration): void;
    public function rotateCredentials(TenantIntegration $integration): TenantIntegrationCredentials;
}
```

The existing `TenantIntegration` entity keeps its `wit_` ULID prefix and gains
an `integration_provider_id` FK — tenant-configured integrations must point to
an allowlisted provider row, not a free-form slug.

### D2 — Lane 2: marketplace app substrate (schema only, no UI)

Three additional entities are added to `platform/integrations` — schema lands
now, no admin UI, no third-party accepted:

```
App                          (apk_)
├── id                       ULID (apk_...)
├── slug                     globally unique — e.g. 'smart-pricing-pro'
├── name
├── description
├── developer_name           first-party for now — 'Stackra' or partner
├── developer_email
├── status                   'draft' | 'in_review' | 'approved' | 'suspended'
├── oauth_client_id          FK to OAuth 2.0 client row (from platform/oauth)
├── allowed_scopes           jsonb array of permission strings
├── webhook_events           jsonb array of event names the app subscribes to
├── admin_extension_url      nullable — iframe embed URL for admin UI
├── partner_share_bps        basis points for revenue share
└── (audit + soft delete)

AppInstallation              (ain_)
├── id                       ULID (ain_...)
├── tenant_id                FK — one install per (tenant, app)
├── app_id                   FK
├── granted_scopes           jsonb — the subset of App.allowed_scopes the tenant approved
├── installed_at             timestamptz
├── installed_by_user_id     FK
├── suspended_at             timestamptz nullable
├── access_token_hash        SHA-256 of the OAuth access token
└── (audit + soft delete)

AppWebhookSubscription       (awh_)
├── id                       ULID (awh_...)
├── app_installation_id      FK
├── event_name               'registration.submitted' | 'enrolled' | ...
├── endpoint_url             the app's webhook receiver
├── secret_hash              SHA-256 of the signing secret
├── enabled                  boolean
└── (audit)
```

App code is served from the third party's own infrastructure. We only carry the
install grant, the scoped permissions, and the webhook subscription list. The
`App` and `AppInstallation` rows exist from day one but the tenant admin UI to
install apps is **not built until we're ready to launch a marketplace**. In the
interim, first-party partner apps can be manually seeded (`is_first_party: true`
implied on `App` — a Slack notifier built by us, an early partner's scouting
extension).

**Explicitly deferred:**

- Marketplace listing UI
- Third-party developer onboarding + review process
- App store search / discovery
- Per-app billing + revenue share (uses `finance/subscription` when built)
- Iframe sandbox / module federation extension host (added when needed)

### D3 — Extension points are declared, unimplemented

Every module that could reasonably be extended (`sports/registrations`,
`sports/session`, `platform/attendance`, `finance/invoice`, `notifications/*`)
declares its `#[AppExtensionPoint]` slots in its blueprint's `extension_points`
field. Slots name the event(s) an app can subscribe to and the scopes required.
Slots are documentation today, live API when the marketplace launches.

### D4 — No third-party apps that touch child data without explicit consent

When the marketplace does open, apps requesting any scope that reads / writes
minor's data (`athletes:read`, `medical:read`, `attendance:write`,
`safeguarding:*`) require:

- Enhanced app review (compliance team sign-off)
- Explicit per-install consent flow shown to the tenant admin, listing every
  affected data class
- COPPA / GDPR data-processing addendum signed by the third party
- Audit log of every app access to minor data in the tenant's activity feed

This is called out here because it's the deciding factor between "we'll launch a
marketplace" and "we probably won't" — and it's the reason we model apps now (to
preserve the option) but don't publish them yet (to avoid the liability).

## Consequences

**Positive:**

- Provider integrations become first-class + allowlisted. Adding a new provider
  is a code deploy with a discovery attribute, not a schema change.
- The marketplace option stays open without a big-bang retrofit later.
- Clear boundary between "we built it" (Lane 1) and "someone else built it"
  (Lane 2) — reviewers, compliance auditors, and support engineers all read the
  same shape.

**Negative:**

- Two related entities (`IntegrationProvider` + `TenantIntegration`) instead of
  one — a small surface increase. Mitigated by the strict "allowlist row only"
  rule on `IntegrationProvider` (no tenant-created providers).
- The `App` + `AppInstallation` + `AppWebhookSubscription` schemas exist without
  an admin UI, so casual readers may wonder why the tables aren't used yet.
  Mitigated by explicit `is_first_party` flags + this ADR.

**Neutral:**

- ULID registry changes: `ipd_` (IntegrationProvider), `apk_` (App), `ain_`
  (AppInstallation), `awh_` (AppWebhookSubscription) added. The existing `wit_`
  (TenantIntegration) prefix is retained.

## Related work

- ADR 0024 — Enrollment funnel is not a CRM (Pipedrive / HubSpot sync arrives
  via this ADR's Lane 1).
- `.kiro/steering/tenancy-columns.md` — every integration + app row carries
  `tenant_id`; no `application_id` shortcut.
- `spatie/laravel-mobile-pass` v1 — Apple + Google Wallet integrations become
  Lane 1 providers (`ipd_` slugs `apple_wallet`, `google_wallet`).
- Blueprint files: `modules/platform/blueprints/integrations/*`, including new
  schemas in `schemas/`.
