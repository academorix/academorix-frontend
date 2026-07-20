# academorix/tenancy

Tenancy domain module for Academorix. Owns the `Tenant` aggregate and its named
`TenantContact` roster, plus the tenant-scope substrate every downstream module
composes.

## Aggregates

| Aggregate       | ULID prefix | Purpose                                                                                                                     |
| --------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `Tenant`        | `ten_`      | Customer of an Academorix Application — carries `application_id` (one of the eight boundary rows per `tenancy-columns.md`). |
| `TenantContact` | `wct_`      | Named contact per role (billing / legal / DPO / technical / security / support / owner). GDPR Art. 30 ROPA compliance.      |

## Install

```bash
composer require academorix/tenancy
```

Auto-registers via `extra.laravel.providers` — no `config/app.php` edits.

## Blueprint

The wire contract (schemas, events, routes, ULID prefixes) lives at
`modules/platform/blueprints/tenancy/`. This package IS the runtime satisfaction
of that blueprint.

## Contributes

- **Traits** — `Academorix\Tenancy\Concerns\BelongsToTenant` +
  `BelongsToTenantOptional` — applied to every row scoped to a tenant.
- **Macro** — `tenantable()` on `Blueprint` (via `#[AsDatabaseBlueprint]`) —
  adds `tenant_id` + FK + composite index in one call.
- **Middleware** — `resolve.tenant`, `resolve.tenant.optional`, `tenant.user`,
  `platform.domain`.
- **Tenancy hooks** — `LogContextTenantHook` (priority 10),
  `CachePrefixTenantHook` (priority 20) — set per-tenant log context + cache
  prefix on request init.
- **Permissions** — `Academorix\Tenancy\Enums\TenancyPermission` (four cases:
  `manage_tenants`, `view_tenants`, `tenants.manage_own_settings`,
  `tenants.manage_contacts`).
- **Roles** — `Academorix\Tenancy\Enums\TenancyRole` (Owner + hierarchy).
- **Commands** — `tenancy:archive`, `tenancy:hard-delete-archived`,
  `tenancy:seed-defaults`.
- **Events** — 11 tenant lifecycle events (`TenantProvisioning`,
  `TenantProvisioned`, `TenantSuspended`, `TenantUnsuspended`, `TenantResumed`,
  `TenantArchived`, `TenantErased`, `TenantSettingsUpdated`,
  `TenantContactAdded/Updated/Removed`).

## Tests

```bash
composer install
vendor/bin/pest
```

## Docs

- Full API + integration guide: `../blueprints/tenancy/readme.md`
- Blueprint contract: `../blueprints/tenancy/module.json`
- Column contract: `.kiro/steering/tenancy-columns.md`
- ADR references: `docs/adr/` in the repo root.
