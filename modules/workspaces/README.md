# workspaces

Multi-workspace substrate for Academorix. Owns the models, traits, migration
macros, workspaces hooks, and middleware that make every other module workspace-scoped
by composition.

Every domain row below `Workspace` on the hierarchy carries a `workspace_id` foreign
key. Cross-workspace reads are refused at the query-scope layer (`BelongsToWorkspace`
global scope) and cross-workspace writes throw
`WorkspaceException::crossWorkspaceAccess()` (400 + `Alert` severity so the security
audit channel picks it up) so a bug can never quietly leak data.

## Placement rationale

`workspaces` sits directly on top of `foundation` and below every other module. It
is intentionally NOT folded into `auth`, `user`, or `organization` — those
modules **consume** workspace-scoping via the `BelongsToWorkspace` trait, they do not
own the workspaces substrate.

`Application` lives here (not in `foundation`) because it is the top-level
container of workspaces — a first-class workspaces concept. Foundation stays truly
foundational: base traits, health, primitives, no domain.

## Entities

Nine entities. Six persistent tables (Application, Workspace, Domain, DomainRecord,
Branding, Identity, WorkspaceContact, WorkspaceIntegration are tables; the last three
make eight tables) plus one config catalogue (BusinessType).

| Model               | Storage          | Purpose                                                                                                                                                                                                                                                                                                   |
| ------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Application`       | table            | Top-level product / deployment container. Every `Workspace` belongs to one. Owner of the locked 8-row list of `application_id` FKs.                                                                                                                                                                          |
| `Workspace`            | table            | The workspace / customer record. Every domain row below the workspaces line carries `workspace_id` back to this table.                                                                                                                                                                                          |
| `BusinessType`      | config catalogue | Enum + config catalogue. Drives per-workspace defaults for features, terminology, roles, entitlements. Referenced by `workspaces.business_type` (string column). Seeded from `data/business-types.json` into `config/workspaces.php`.                                                                              |
| `Domain`            | table            | Custom domain per workspace. Central-host discovery joins here via our own `WorkspaceResolver`.                                                                                                                                                                                                                 |
| `DomainRecord`      | table            | DNS record (CNAME / TXT / MX / A / AAAA / CAA) per Domain. Used for auto-verify + delegation UI.                                                                                                                                                                                                          |
| `Branding`          | table            | Theme + logo profile per workspace. Multiple profiles per workspace (e.g. per-domain, dark / light). The Workspace row keeps a denormalised `branding` JSONB as a fallback for the workspace picker.                                                                                                               |
| `Identity`          | table            | Cross-workspace person. Application-scoped (no `workspace_id`), one Identity → many `Users` in different workspaces. Solves the "invited to two workspaces" problem. Owned by `workspaces` because the linkage is a workspaces-boundary concept; the workspace-scoped `User` (in `user`) references this via `identity_id`. |
| `WorkspaceContact`     | table            | Billing / legal / technical / DPO / security contact per workspace. Legally distinct from any `owner_user_id`: GDPR Art. 30 requires a discrete DPO contact per controller.                                                                                                                                  |
| `WorkspaceIntegration` | table            | SSO (SAML / OIDC) / SCIM / HRIS / LMS configuration per workspace. Stub in v1 (empty resource folder), filled in v2. Reserved now to avoid a one-way-door migration later.                                                                                                                                   |

## The workspace hierarchy

```
Application (this module)
  └── Workspace (this module)
        ├── Organization       (organization module — structural sub-brand)
        │     └── Branch       (branch module — physical venue)
        │           └── Facility (facilities module — pool, pitch, court)
        ├── Region             (region module — commercial context)
        ├── User               (user module — accounts scoped to the workspace)
        │     └── identity_id  → Identity (this module — cross-workspace person)
        ├── Domain             (this module — custom domain)
        │     └── DomainRecord (this module — DNS record)
        ├── Branding           (this module — theme profiles)
        ├── WorkspaceContact      (this module — billing / legal / DPO / …)
        ├── WorkspaceIntegration  (this module — SSO / SCIM / HRIS)
        └── Subscription       (subscription module — plan + billing state)
```

Every non-Workspace row below carries `workspace_id` via `BelongsToWorkspace`. The only
workspaces-owned exception is `Identity` — it is `application_id`-scoped because a
Person can legitimately belong to multiple workspaces under the same Application.

## Public surface

### Central host (`platform.domain` middleware)

| Method + path                       | Purpose                                  | Auth      |
| ----------------------------------- | ---------------------------------------- | --------- |
| `GET /api/current-workspace`           | Public branding preview (host-resolved). | none      |
| `POST /api/v1/workspaces/register`     | Self-serve workspace creation.           | throttled |
| `POST /api/v1/auth/find-workspaces` | Email-your-workspace recovery.           | throttled |

### Platform-admin host

CRUD over every entity in this module:

| Resource          | Endpoints                                                         | Policy                                    |
| ----------------- | ----------------------------------------------------------------- | ----------------------------------------- |
| Application       | `GET \| POST \| PUT \| DELETE /api/v1/applications[/{id}]`        | `ApplicationPolicy@*`                     |
| Workspace            | `GET \| POST \| PUT \| DELETE /api/v1/workspaces[/{id}]`             | `WorkspacePolicy@*` + lifecycle actions      |
| BusinessType      | `GET \| POST \| PUT \| DELETE /api/v1/business-types[/{key}]`     | `BusinessTypePolicy@*`                    |
| Domain            | `GET \| POST \| PUT \| DELETE /api/v1/domains[/{id}]`             | `DomainPolicy@*`                          |
| Branding          | `GET \| POST \| PUT \| DELETE /api/v1/brandings[/{id}]`           | `BrandingPolicy@*`                        |
| Identity          | `GET /api/v1/identities[/{id}]`                                   | `IdentityPolicy@*` (read-only from admin) |
| WorkspaceContact     | `GET \| POST \| PUT \| DELETE /api/v1/workspace-contacts[/{id}]`     | `WorkspaceContactPolicy@*`                   |
| WorkspaceIntegration | `GET \| POST \| PUT \| DELETE /api/v1/workspace-integrations[/{id}]` | `WorkspaceIntegrationPolicy@*`               |

### Workspace host

| Method + path                          | Purpose                                            | Auth                                           |
| -------------------------------------- | -------------------------------------------------- | ---------------------------------------------- |
| `GET /api/current-workspace`              | Active workspace summary (branding).                  | none (host-resolved)                           |
| `GET /api/v1/me/workspaces`            | Workspaces the caller can switch to.               | `auth:sanctum`                                 |
| `PATCH /api/current-workspace`            | Workspace self-edit (name + branding + provisioning). | `auth:sanctum` + `settings.update`             |
| `* /api/v1/workspace/domains[/{id}]`      | Workspace-owned domain CRUD.                          | `auth:sanctum` + `workspaces.manage_domains`      |
| `* /api/v1/workspace/brandings[/{id}]`    | Workspace-owned branding CRUD.                        | `auth:sanctum` + `workspaces.manage_branding`     |
| `* /api/v1/workspace/contacts[/{id}]`     | Workspace-owned contact CRUD.                         | `auth:sanctum` + `workspaces.manage_contacts`     |
| `* /api/v1/workspace/integrations[/{id}]` | Workspace-owned integration CRUD (v2).                | `auth:sanctum` + `workspaces.manage_integrations` |

The workspace summary + workspace list are also embedded in `GET /api/auth/me` (see
`.kiro/specs/backend-frontend-alignment/API_CONTRACT.md` §3) so the SPA does not
have to make dedicated round-trips for them on every screen.

## Contributions

- **Permissions** — `manage_workspaces`, `view_workspaces`, `manage_applications`,
  `view_applications`, `manage_business_types` (platform_admin guard);
  `workspaces.manage_own_settings`, `workspaces.manage_domains`,
  `workspaces.manage_branding`, `workspaces.manage_contacts`,
  `workspaces.manage_integrations` (sanctum guard).
- **Roles** — none (roles are owned by `access`, this module publishes seeded
  permissions).
- **Features** — none (feature toggles are owned by `feature-flag`;
  `BusinessType.default_config.features` is the catalogue).
- **Entitlements** — none (Workspace is the entitlement target, not a slotted
  resource).
- **Traits** — `BelongsToWorkspace` (workspace_id + auto-fill + global scope),
  `BelongsToApplication` (application_id + auto-fill for boundary rows).
- **Blueprints** — `->workspaceable()` and `->applicable()` migration macros.
- **Middleware** — `resolve.workspace`, `workspace.user`, `platform.domain`,
  `api.version`.
- **Events** — 16 domain events (workspace lifecycle + domain lifecycle + contact /
  integration lifecycle + identity). All `ShouldDispatchAfterCommit`.
- **Workspaces hooks** — `LogContextWorkspaceHook` (priority 10),
  `CachePrefixWorkspaceHook` (priority 20).

## Depends on

- `foundation` — `Application` was previously scoped here but has moved to
  `workspaces`. Foundation still provides `HasSystemFlag`, `HasUserstamps`,
  `HasAuditable`, base repository / service / controller primitives, and health
  aggregation.

## Depended on by

Every module below Workspace on the hierarchy — see `module.json.extendedBy`.

## Blueprint layout (this folder)

```
modules/workspaces/
├── module.json                 Laravel module descriptor + contributions
├── readme.md                   this file
├── changelog.md                per-module changelog (auditor-friendly)
├── schemas/                    JSON Schema Draft 2020-12 per entity
│   ├── application.schema.json
│   ├── workspace.schema.json
│   ├── business-type.schema.json
│   ├── domain.schema.json
│   ├── domain-record.schema.json
│   ├── branding.schema.json
│   ├── identity.schema.json
│   ├── workspace-contact.schema.json
│   └── workspace-integration.schema.json
├── relations.json              cross-module relations
├── traits.json                 model traits contributed + consumed
├── routes.json                 HTTP routes grouped by host
├── middleware.json             HTTP middleware
├── events.json                 domain events + payload
├── listeners.json              subscriber bindings this module owns (empty here — Workspaces publishes)
├── observers.json              Eloquent observers
├── hooks.json                  workspaces hooks
├── jobs.json                   queued jobs
├── schedule.json               cron entries
├── commands.json               artisan commands
├── notifications.json          Laravel notifications
├── broadcasts.json             broadcast channels
├── policies.json               authorization policies
├── permissions.json            permission strings
├── features.json               reference (empty — catalogue lives on BusinessType)
├── entitlements.json           reference (empty — Workspace is the entitlement target)
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
│   ├── workspaces.json
│   ├── business-types.json
│   ├── domains.json
│   ├── domain-records.json
│   ├── brandings.json
│   ├── identities.json
│   ├── workspace-contacts.json
│   ├── workspace-integrations.json
│   ├── my-workspaces.json      workspace list projection used by SDUI picker
│   └── current-workspace.json
└── sdui/                       server-driven UI blueprints
    ├── readme.md
    ├── resources/              admin CRUD per entity (Filament-style, REST-backed)
    │   ├── application/{list,create,edit,show}.screen.json + columns/filters/bulk-actions
    │   ├── workspace/{list,create,edit,show,settings}.screen.json
    │   ├── business-type/{list,create,edit,show}.screen.json
    │   ├── domain/{list,create,edit,show}.screen.json
    │   ├── domain-record/{list,show}.screen.json
    │   ├── branding/{list,edit,show}.screen.json
    │   ├── identity/{list,show}.screen.json
    │   ├── workspace-contact/{list,create,edit,show}.screen.json
    │   └── workspace-integration/{list,create,edit,show}.screen.json
    ├── screens/
    │   └── workspace-picker.screen.json
    ├── forms/
    │   └── workspace-branding.form.json
    └── widgets/
        └── business-type-select.widget.json
```

See `.kiro/specs/module-blueprints/PLAN.md` for the full per-artefact contract
and `.kiro/product/analyses/module-blueprints-review.md` for the enterprise
review that drove this refactor.
