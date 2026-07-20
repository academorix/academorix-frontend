# academorix/application

Application (product-catalogue) domain module for Academorix. Owns the global
cross-tenant registry of Academorix products and the BusinessType catalogue.

## Aggregates

| Aggregate      | ULID prefix | Storage     | Purpose                                                                                                                                                |
| -------------- | ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Application`  | `app_`      | Eloquent    | One row per Academorix product (Sports, Marketplace, ...). Every Tenant belongs to exactly one.                                                        |
| `BusinessType` | `bst_`      | Dual-source | Code-primary via `BusinessTypeEnum`, DB mirror in `business_types` for admin visibility + tenant customs (per steering `enum-db-seed-dual-source.md`). |

## Install

```bash
composer require academorix/application
```

Auto-registers via `extra.laravel.providers` — no `config/app.php` edits.

## Blueprint

The wire contract (schemas, events, routes, ULID prefixes) lives at
`modules/platform/blueprints/application/`. This package IS the runtime
satisfaction of that blueprint.

## Contributes

- Trait: `Academorix\Application\Concerns\BelongsToApplication` — applied to
  every row at the tenancy boundary (Tenant, Role, Permission,
  TenantSubscription, EntitlementLicense, Audit, Activity — per
  `.kiro/steering/tenancy-columns.md` §2 "eight boundary rows").
- Permissions: `Academorix\Application\Enums\ApplicationPermission`.
- Roles: `Academorix\Application\Enums\ApplicationRole`.
- Commands: `application:sync-catalogue`, `application:list`.
- Events: `ApplicationEnabled`, `ApplicationDisabled`, `BusinessTypeAdded`,
  `BusinessTypeArchived`.

## BusinessType — dual-source pattern

`BusinessTypeEnum` is authoritative for code branches. `business_types` table
mirrors it via `BusinessTypeSeeder` on every deploy. `BusinessTypeObserver` +
`BusinessTypePolicy` together enforce system-row immutability. Tenant admins may
create custom rows (`is_system = false`) that resolve as
`BusinessTypeEnum::Custom` in code. See
`.kiro/steering/enum-db-seed-dual-source.md` for the canonical shape.

## Tests

```bash
composer install
vendor/bin/pest
```

## Docs

- Full API + integration guide: `../blueprints/application/readme.md`
- Blueprint contract: `../blueprints/application/module.json`
- ADR references: `docs/adr/` in the repo root.
