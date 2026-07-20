# tenants

Multi-tenant substrate for Academorix. Owns the models, traits, migration
macros, tenancy hooks, and middleware that make every other module tenant-scoped
by composition.

Every domain row below `Tenant` on the hierarchy carries a `tenant_id` foreign
key. Cross-tenant reads are refused at the query-scope layer (`BelongsToTenant`
global scope) and cross-tenant writes throw
`TenantException::crossTenantAccess()` (400 + `Alert` severity so the security
audit channel picks it up) so a bug can never quietly leak data.

## Placement rationale

`tenants` sits directly on top of `foundation` and below every other module. It
is intentionally NOT folded into `auth`, `user`, or `organization` — those
modules **consume** tenant-scoping via the `BelongsToTenant` trait, they do not
own the tenancy substrate.

`Application` lives here (not in `foundation`) because it is the top-level
container of tenants — a first-class tenants concept. Foundation stays truly
foundational: base traits, health, primitives, no domain.

## Entities

Nine entities. Six persistent tables (Application, Tenant, Domain, DomainRecord,
Branding, Identity, TenantContact, TenantIntegration are tables; the last three
make eight tables) plus one config catalogue (BusinessType).

| Model               | Storage          | Purpose                                                                                                                                                                                                                                                                                                |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Application`       | table            | Top-level product / deployment container. Every `Tenant` belongs to one. Owner of the locked 8-row list of `application_id` FKs.                                                                                                                                                                       |
| `Tenant`            | table            | The tenant / customer record. Every domain row below the tenants line carries `tenant_id` back to this table.                                                                                                                                                                                          |
| `BusinessType`      | config catalogue | Enum + config catalogue. Drives per-tenant defaults for features, terminology, roles, entitlements. Referenced by `tenants.business_type` (string column). Seeded from `data/business-types.json` into `config/tenants.php`.                                                                           |
| `Domain`            | table            | Custom domain per tenant. Central-host discovery joins here via our own `TenantResolver`.                                                                                                                                                                                                              |
| `DomainRecord`      | table            | DNS record (CNAME / TXT / MX / A / AAAA / CAA) per Domain. Used for auto-verify + delegation UI.                                                                                                                                                                                                       |
| `Branding`          | table            | Theme + logo profile per tenant. Multiple profiles per tenant (e.g. per-domain, dark / light). The Tenant row keeps a denormalised `branding` JSONB as a fallback for the tenant picker.                                                                                                               |
| `Identity`          | table            | Cross-tenant person. Application-scoped (no `tenant_id`), one Identity → many `Users` in different tenants. Solves the "invited to two tenants" problem. Owned by `tenants` because the linkage is a tenants-boundary concept; the tenant-scoped `User` (in `user`) references this via `identity_id`. |
| `TenantContact`     | table            | Billing / legal / technical / DPO / security contact per tenant. Legally distinct from any `owner_user_id`: GDPR Art. 30 requires a discrete DPO contact per controller.                                                                                                                               |
| `TenantIntegration` | table            | SSO (SAML / OIDC) / SCIM / HRIS / LMS configuration per tenant. Stub in v1 (empty resource folder), filled in v2. Reserved now to avoid a one-way-door migration later.                                                                                                                                |

## The tenant hierarchy

```
Application (this module)
  └── Tenant (this module)
        ├── Organization       (organization module — structural sub-brand)
        │     └── Branch       (branch module — physical venue)
        │           └── Facility (facilities module — pool, pitch, court)
        ├── Region             (region module — commercial context)
        ├── User               (user module — accounts scoped to the tenant)
        │     └── identity_id  → Identity (this module — cross-tenant person)
        ├── Domain             (this module — custom domain)
        │     └── DomainRecord (this module — DNS record)
        ├── Branding           (this module — theme profiles)
        ├── TenantContact      (this module — billing / legal / DPO / …)
        ├── TenantIntegration  (this module — SSO / SCIM / HRIS)
        └── Subscription       (subscription module — plan + billing state)
```

Every non-Tenant row below carries `tenant_id` via `BelongsToTenant`. The only
tenants-owned exception is `Identity` — it is `application_id`-scoped because a
Person can legitimately belong to multiple tenants under the same Application.

## Public surface

### Central host (`platform.domain` middleware)

| Method + path                    | Purpose                                  | Auth      |
| -------------------------------- | ---------------------------------------- | --------- |
| `GET /api/current-tenant`        | Public branding preview (host-resolved). | none      |
| `POST /api/v1/tenants/register`  | Self-serve tenant creation.              | throttled |
| `POST /api/v1/auth/find-tenants` | Email-your-tenant recovery.              | throttled |

### Platform-admin host

CRUD over every entity in this module:

| Resource          | Endpoints                                                         | Policy                                    |
| ----------------- | ----------------------------------------------------------------- | ----------------------------------------- |
| Application       | `GET \| POST \| PUT \| DELETE /api/v1/applications[/{id}]`        | `ApplicationPolicy@*`                     |
| Tenant            | `GET \| POST \| PUT \| DELETE /api/v1/tenants[/{id}]`             | `TenantPolicy@*` + lifecycle actions      |
| BusinessType      | `GET \| POST \| PUT \| DELETE /api/v1/business-types[/{key}]`     | `BusinessTypePolicy@*`                    |
| Domain            | `GET \| POST \| PUT \| DELETE /api/v1/domains[/{id}]`             | `DomainPolicy@*`                          |
| Branding          | `GET \| POST \| PUT \| DELETE /api/v1/brandings[/{id}]`           | `BrandingPolicy@*`                        |
| Identity          | `GET /api/v1/identities[/{id}]`                                   | `IdentityPolicy@*` (read-only from admin) |
| TenantContact     | `GET \| POST \| PUT \| DELETE /api/v1/tenant-contacts[/{id}]`     | `TenantContactPolicy@*`                   |
| TenantIntegration | `GET \| POST \| PUT \| DELETE /api/v1/tenant-integrations[/{id}]` | `TenantIntegrationPolicy@*`               |

### Tenant host

| Method + path                          | Purpose                                            | Auth                                           |
| -------------------------------------- | -------------------------------------------------- | ---------------------------------------------- |
| `GET /api/current-tenant`              | Active tenant summary (branding).                  | none (host-resolved)                           |
| `GET /api/v1/me/tenants`               | Tenancy the caller can switch to.                  | `auth:sanctum`                                 |
| `PATCH /api/current-tenant`            | Tenant self-edit (name + branding + provisioning). | `auth:sanctum` + `settings.update`             |
| `* /api/v1/tenant/domains[/{id}]`      | Tenant-owned domain CRUD.                          | `auth:sanctum` + `tenants.manage_domains`      |
| `* /api/v1/tenant/brandings[/{id}]`    | Tenant-owned branding CRUD.                        | `auth:sanctum` + `tenants.manage_branding`     |
| `* /api/v1/tenant/contacts[/{id}]`     | Tenant-owned contact CRUD.                         | `auth:sanctum` + `tenants.manage_contacts`     |
| `* /api/v1/tenant/integrations[/{id}]` | Tenant-owned integration CRUD (v2).                | `auth:sanctum` + `tenants.manage_integrations` |

The tenant summary + tenant list are also embedded in `GET /api/auth/me` (see
`.kiro/specs/backend-frontend-alignment/API_CONTRACT.md` §3) so the SPA does not
have to make dedicated round-trips for them on every screen.

## Contributions

- **Permissions** — `manage_tenants`, `view_tenants`, `manage_applications`,
  `view_applications`, `manage_business_types` (platform_admin guard);
  `tenants.manage_own_settings`, `tenants.manage_domains`,
  `tenants.manage_branding`, `tenants.manage_contacts`,
  `tenants.manage_integrations` (sanctum guard).
- **Roles** — none (roles are owned by `access`, this module publishes seeded
  permissions).
- **Features** — none (feature toggles are owned by `feature-flag`;
  `BusinessType.default_config.features` is the catalogue).
- **Entitlements** — none (Tenant is the entitlement target, not a slotted
  resource).
- **Traits** — `BelongsToTenant` (tenant_id + auto-fill + global scope),
  `BelongsToApplication` (application_id + auto-fill for boundary rows).
- **Blueprints** — `->tenantable()` and `->applicable()` migration macros.
- **Middleware** — `resolve.tenant`, `tenant.user`, `platform.domain`,
  `api.version`.
- **Events** — 16 domain events (tenant lifecycle + domain lifecycle + contact /
  integration lifecycle + identity). All `ShouldDispatchAfterCommit`.
- **Tenancy hooks** — `LogContextTenantHook` (priority 10),
  `CachePrefixTenantHook` (priority 20).

## Depends on

- `foundation` — `Application` was previously scoped here but has moved to
  `tenants`. Foundation still provides `HasSystemFlag`, `HasUserstamps`,
  `HasAuditable`, base repository / service / controller primitives, and health
  aggregation.

## Depended on by

Every module below Tenant on the hierarchy — see `module.json.extendedBy`.

## Blueprint layout (this folder)

```
modules/tenancy/
├── module.json                 Laravel module descriptor + contributions
├── readme.md                   this file
├── changelog.md                per-module changelog (auditor-friendly)
├── schemas/                    JSON Schema Draft 2020-12 per entity
│   ├── application.schema.json
│   ├── tenant.schema.json
│   ├── business-type.schema.json
│   ├── domain.schema.json
│   ├── domain-record.schema.json
│   ├── branding.schema.json
│   ├── identity.schema.json
│   ├── tenant-contact.schema.json
│   └── tenant-integration.schema.json
├── relations.json              cross-module relations
├── traits.json                 model traits contributed + consumed
├── routes.json                 HTTP routes grouped by host
├── middleware.json             HTTP middleware
├── events.json                 domain events + payload
├── listeners.json              subscriber bindings this module owns (empty here — Tenancy publishes)
├── observers.json              Eloquent observers
├── hooks.json                  tenancy hooks
├── jobs.json                   queued jobs
├── schedule.json               cron entries
├── commands.json               artisan commands
├── notifications.json          Laravel notifications
├── broadcasts.json             broadcast channels
├── policies.json               authorization policies
├── permissions.json            permission strings
├── features.json               reference (empty — catalogue lives on BusinessType)
├── entitlements.json           reference (empty — Tenant is the entitlement target)
├── health.json                 health probes aggregated by foundation
├── metrics.json                OpenTelemetry / Prometheus metrics
├── analytics.json              product analytics events
├── caches.json                 cache keys + TTLs
├── retention.json              data retention windows
├── compliance.json             regulatory regime × control × evidence
├── data-classes.json           field-level PII classification
├── errors.json                 error catalogue (code × HTTP × i18n × retryable)
├── subprocessors.json          third-party services this module uses
├── webhooks.json               outbound customer-consumable webhooks
├── feature-flags.json          rollout flags (distinct from business features)
├── data/                       JSON fixtures matching schemas 1:1
│   ├── applications.json
│   ├── tenants.json
│   ├── business-types.json
│   ├── domains.json
│   ├── domain-records.json
│   ├── brandings.json
│   ├── identities.json
│   ├── tenant-contacts.json
│   ├── tenant-integrations.json
│   ├── my-tenants.json      tenant list projection used by SDUI picker
│   └── current-tenant.json
└── sdui/                       server-driven UI blueprints
    ├── readme.md
    ├── resources/              admin CRUD per entity (Filament-style, REST-backed)
    │   ├── application/{list,create,edit,show}.screen.json + columns/filters/bulk-actions
    │   ├── tenant/{list,create,edit,show,settings}.screen.json
    │   ├── business-type/{list,create,edit,show}.screen.json
    │   ├── domain/{list,create,edit,show}.screen.json
    │   ├── domain-record/{list,show}.screen.json
    │   ├── branding/{list,edit,show}.screen.json
    │   ├── identity/{list,show}.screen.json
    │   ├── tenant-contact/{list,create,edit,show}.screen.json
    │   └── tenant-integration/{list,create,edit,show}.screen.json
    ├── screens/
    │   └── tenant-picker.screen.json
    ├── forms/
    │   └── tenant-branding.form.json
    └── widgets/
        └── business-type-select.widget.json
```

See `.kiro/specs/module-blueprints/PLAN.md` for the full per-artefact contract
and `.kiro/product/analyses/module-blueprints-review.md` for the enterprise
review that drove this refactor.
