# tenants — SDUI blueprints

Server-Driven UI for the tenancy module. Three surface tiers:

1. **Central host** — public tenant picker (unauthenticated). Consumers land
   here after `/api/current-tenant` returns a `central` host kind.
2. **Platform admin host** — cross-tenant CRUD across every entity this module
   owns.
3. **Tenant host** — self-service CRUD for the tenant's own resources (domains,
   branding, contacts, integrations).

## Surfaces

### `screens/`

- `tenant-picker.screen.json` — Central host. Consumes `GET /api/v1/me/tenants`
  (behind sanctum-lite) + `GET /api/current-tenant` (public). Shows the caller's
  accessible tenants with a switch action + a "Create tenant" call to action for
  new users.

### `forms/`

- `tenant-branding.form.json` — Reusable form embedded in tenant
  `settings.screen.json` + platform-admin `branding/edit.screen.json`. Colour
  picker + logo upload + preview + WCAG contrast check.

### `widgets/`

- `business-type-select.widget.json` — Async Select bound to
  `GET /api/v1/business-types`. Used at tenant registration + platform-admin
  tenant create. Renders each option with icon + terminology preview.

### `resources/`

Full CRUD per entity for platform admin + read-only reference views for tenant
surfaces. Screen files follow the Refine convention: `list.screen.json`,
`create.screen.json`, `edit.screen.json`, `show.screen.json`.

| Entity                | Screens                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| `application/`        | list, create, edit, show                                                   |
| `tenant/`             | list, create, edit, show, **settings** (tenant self-edit)                  |
| `business-type/`      | list, create, edit, show                                                   |
| `domain/`             | list, create, edit, show                                                   |
| `domain-record/`      | list, show (records auto-created by observer; no manual create)            |
| `branding/`           | list, edit, show (create happens inline via TenantObserver)                |
| `identity/`           | list, show (identities are managed by user + auth modules; read-only here) |
| `tenant-contact/`     | list, create, edit, show                                                   |
| `tenant-integration/` | list, create, edit, show                                                   |

## Data sources

- `applications` / `applications/{id}` — platform admin
- `tenants` / `tenants/{id}` — platform admin; tenant self via `/current-tenant`
- `business-types` — cached; drives terminology + defaults
- `domains` / `domains/{id}` (with `include=domain_records`) — tenant + platform
  admin
- `brandings` / `brandings/{id}` — tenant + platform admin
- `identities` / `identities/{id}` — platform admin read-only
- `tenant-contacts` / `tenant-contacts/{id}` — tenant + platform admin
- `tenant-integrations` / `tenant-integrations/{id}` — tenant + platform admin

## Broadcast subscriptions

- `tenant.{id}.lifecycle` — refresh tenant show + list on suspend / resume /
  archive
- `tenant.{id}.branding` — live preview on branding save
- `tenant.{id}.domain` — refresh domain list on DomainVerified /
  DomainVerificationFailed
- `tenant.{id}.integration` — refresh integration list on
  TenantIntegrationSyncFailed
