# `modules/platform/` — platform-service blueprints

The **tenancy + configuration hierarchy** — everything that answers _"who is
this request for, what identity does it render under, and what config resolves
under that identity."_ **8 modules on disk** after the v0.3 split.

Deploys to `academorix-backend/apps/platform-service/` (see
[`apps/platform-service/README.md`](../../../academorix/academorix-backend/apps/platform-service/README.md)).

## Modules — on disk

Grouped by boot wave. Each module has a clearly bounded context and a distinct
lifecycle from its neighbours.

| Module                                      | Wave | Priority | Schemas | Purpose                                                                                    |
| ------------------------------------------- | ---- | -------- | ------- | ------------------------------------------------------------------------------------------ |
| [`application/`](./application/readme.md)   | 0.5  | **8**    | 2       | Global product-catalogue registry (Application + BusinessType). Cross-tenant.              |
| [`tenants/`](./tenants/readme.md)           | 1    | 10       | 2       | The tenant core (Tenant + TenantContact). Publishes `BelongsToTenant`.                     |
| [`settings/`](./settings/readme.md)         | 2    | 22       | 3       | Attribute-discovered settings registry (SettingsGroup + SettingsSchema + SettingValue).    |
| [`webhook/`](./webhook/readme.md)           | 3    | 22       | 2       | Outbound webhook substrate (WebhookSubscription + WebhookDelivery).                        |
| [`domains/`](./domains/readme.md)           | 3    | 12       | 2       | Custom domains + DNS records + certificate rotation (Domain + DomainRecord).               |
| [`branding/`](./branding/readme.md)         | 3    | 12       | 1       | White-label theme + logo + OG-image profile per tenant (Branding).                         |
| [`integrations/`](./integrations/readme.md) | 3    | 12       | 1       | Third-party integration credentials, encrypted at rest (TenantIntegration).                |
| [`storage/`](./storage/readme.md)           | 3    | 24       | 4       | File uploads, signed URLs, variants (File + FileVariant + SignedUrlAudit + ChunkedUpload). |

**Total on disk: 8 modules, 17 entities.**

## v0.3 split — what changed and why

`tenants` used to be a 9-entity mega-module. At v0.3 we extracted it into **5
clean modules** applying the 3-test in `.kiro/steering/module-partitioning.md`:

- **`application`** — Application + BusinessType. Extracted because both are
  cross-tenant (tenant_id=null always) and change on a slow cadence. Boots
  BEFORE tenants (priority 8).
- **`domains`** — Domain + DomainRecord. Extracted because DNS verification and
  certificate rotation are long-running workflows with their own lifecycle,
  distinct from a Tenant's lifecycle.
- **`branding`** — Branding. Extracted because it has a 100:1 read/write ratio
  and warrants its own cache pattern (Redis-cached, event-invalidated).
- **`integrations`** — TenantIntegration. Extracted because integration
  credentials carry different sensitivity (encrypted at rest, KMS-derived key)
  than tenant config.
- **`Identity`** — **REMOVED from tenants entirely**. Identity is a credential
  record; it belongs in identity-service, not platform-service. The tenants
  schema previously carried an Identity stub — that was a design mistake and has
  been deleted. Author the real Identity module under
  `modules/identity/identity/` when the identity-service build kicks off (see
  [`modules/identity/README.md`](../identity/README.md)).

## Modules — planned

Four modules will still be added to complete the platform-service surface:

| Module          | Purpose                                                                       |
| --------------- | ----------------------------------------------------------------------------- |
| `organization/` | Structural sub-brand inside a Tenant. Nestable per tier.                      |
| `region/`       | Commercial / regulatory zone — currency, tax, timezone, locale.               |
| `branch/`       | Physical venue. Carries `organization_id` + `region_id` (the axes meet here). |
| `feature-flag/` | Kill switches, overrides, rollouts, plan gates.                               |

These are Phase 4 of the platform-service implementation plan (see
[`.kiro/specs/platform-service-implementation/README.md`](../../.kiro/specs/platform-service-implementation/README.md)).

## Boot order within the tier

```
application (8)
    ↓
tenants (10)
    ↓
settings (22)   webhook (22)   domains (12)   branding (12)   integrations (12)
                                    ↓
                                storage (24)
```

Every module in `platform/` depends on either `application` (via tenants) or
`tenants` directly. Nothing here depends on `access/`, `billing/`,
`notifications/`, or `compliance/`. It's the earliest tier in the DAG after
`shared/` and `identity/`.

## Cross-cutting invariants

- **Every entity below Application is tenant-scoped** via `BelongsToTenant` (or
  `BelongsToTenantOptional` for platform-wide catalogue rows). The query builder
  auto-scopes to the active tenant; cross-tenant reads return zero rows.
- **`storage` folds into platform-service initially** — extraction to its own
  service only when file bandwidth/CPU crosses ~30% of platform-service's
  budget.
- **`webhook` is OUTBOUND only** — inbound provider webhooks (Stripe → us,
  Paddle → us) live in `billing-service` as receivers, not here.
- **Application, Tenant, and the eight rows in
  [`tenancy-columns.md`](../../.kiro/steering/tenancy-columns.md) §2 carry
  `application_id` directly.** Every other row cascades through
  `tenant_id → tenants.application_id`.
- **`integrations.config` is encrypted at rest** — reading always goes through
  `IntegrationSecretsCipher::decrypt(...)`; the wire never exposes the raw JSON.

## For agents

**Pick-up order when working on platform-service code**:

1. Read the master index (`../README.md`).
2. Read this file.
3. Read
   [`.kiro/steering/module-partitioning.md`](../../.kiro/steering/module-partitioning.md)
   — the rule that governs when to extract a module.
4. Read
   [`.kiro/specs/platform-service-implementation/README.md`](../../.kiro/specs/platform-service-implementation/README.md)
   — the phase-by-phase build plan.
5. Read the target module's `readme.md` and `module.json`.
6. Read the target module's schemas + traits before writing code.

## Related

- `../README.md` — master index.
- `.kiro/specs/platform-architecture/DECISION.md` §4 — module→service map.
- `.kiro/specs/platform-service-implementation/README.md` — the build plan.
- `.kiro/steering/module-partitioning.md` — when to extract vs keep together.
- `.kiro/steering/hierarchy.md` §2 — structural model (the full tree).
- `.kiro/steering/tenancy-columns.md` — three-axes column contract.
