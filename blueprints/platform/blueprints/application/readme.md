# application

**Global product-catalogue registry.** Owns `Application` (Sports, Marketplace,
Ticketing, Venue, Education) and `BusinessType` (academy, gym, school,
federation, club, ...). Both entities are **cross-tenant** (tenant_id is always
null) and change so infrequently they're essentially seed data.

Extracted from `tenants` at v0.3 as part of the platform-tier split. Rationale:
a product-catalogue mutation should never require a tenants service redeploy.
Application changes on a slow cadence (roughly one entry per Academorix product
launch) and BusinessType is a config catalogue the platform admin edits
directly.

## Entities

| Entity         | ULID   | Description                                                                                                                                                      |
| -------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Application`  | `app_` | Top-level product container. Every tenant-scoped row cascades to an Application via `tenants.application_id`.                                                    |
| `BusinessType` | `btp_` | The "shape" a Tenant presents (academy, gym, school, federation, club, ...). Drives default terminology + feature toggles + default roles per `hierarchy.md` §7. |

## Contributions

- **Trait:** `BelongsToApplication` — every tenants-boundary model (Tenant,
  Domain, and every one of the eight `application_id`-bearing rows in
  `tenancy-columns.md` §2) composes it.
- **Migration macro:** `applicable()` — mirror of `tenantable()` but for
  Application boundaries. Adds `application_id` + FK + index in one call.
- **Middleware:** none directly owned — application resolution is host-based and
  lives in `tenants`'s `resolve.tenant` middleware.

## Boot order

Priority **8** — boots BEFORE `tenants` (priority 10). Every tenants row
FK-cascades to an Application, so Application must exist first.

## Cross-cutting invariants

- `Application` and `BusinessType` are the ONLY entities in the platform tier
  that are cross-tenant. Every other entity carries `tenant_id`.
- The `application_id` on `tenants.tenants` is one of the eight
  `application_id`-bearing rows per `tenancy-columns.md` §2.
- Neither entity is soft-deleted — `is_active` on Application controls
  visibility; BusinessType uses `is_archived`.

## Related

- `../README.md` — platform tier index.
- `.kiro/steering/hierarchy.md` §2 — structural model.
- `.kiro/steering/tenancy-columns.md` §2 — the eight `application_id`-bearing
  rows.
