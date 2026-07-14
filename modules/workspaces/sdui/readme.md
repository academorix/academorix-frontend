# workspaces — SDUI blueprints

Server-Driven UI for the workspaces module. Three surface tiers:

1. **Central host** — public workspace picker (unauthenticated). Consumers land here after `/api/current-workspace` returns a `central` host kind.
2. **Platform admin host** — cross-workspace CRUD across every entity this module owns.
3. **Workspace host** — self-service CRUD for the workspace's own resources (domains, branding, contacts, integrations).

## Surfaces

### `screens/`

- `workspace-picker.screen.json` — Central host. Consumes `GET /api/v1/me/workspaces` (behind sanctum-lite) + `GET /api/current-workspace` (public). Shows the caller's accessible workspaces with a switch action + a "Create workspace" call to action for new users.

### `forms/`

- `workspace-branding.form.json` — Reusable form embedded in workspace `settings.screen.json` + platform-admin `branding/edit.screen.json`. Colour picker + logo upload + preview + WCAG contrast check.

### `widgets/`

- `business-type-select.widget.json` — Async Select bound to `GET /api/v1/business-types`. Used at workspace registration + platform-admin workspace create. Renders each option with icon + terminology preview.

### `resources/`

Full CRUD per entity for platform admin + read-only reference views for workspace surfaces. Screen files follow the Refine convention: `list.screen.json`, `create.screen.json`, `edit.screen.json`, `show.screen.json`.

| Entity | Screens |
| --- | --- |
| `application/` | list, create, edit, show |
| `workspace/` | list, create, edit, show, **settings** (workspace self-edit) |
| `business-type/` | list, create, edit, show |
| `domain/` | list, create, edit, show |
| `domain-record/` | list, show (records auto-created by observer; no manual create) |
| `branding/` | list, edit, show (create happens inline via WorkspaceObserver) |
| `identity/` | list, show (identities are managed by user + auth modules; read-only here) |
| `workspace-contact/` | list, create, edit, show |
| `workspace-integration/` | list, create, edit, show |

## Data sources

- `applications` / `applications/{id}` — platform admin
- `workspaces` / `workspaces/{id}` — platform admin; workspace self via `/current-workspace`
- `business-types` — cached; drives terminology + defaults
- `domains` / `domains/{id}` (with `include=domain_records`) — workspace + platform admin
- `brandings` / `brandings/{id}` — workspace + platform admin
- `identities` / `identities/{id}` — platform admin read-only
- `workspace-contacts` / `workspace-contacts/{id}` — workspace + platform admin
- `workspace-integrations` / `workspace-integrations/{id}` — workspace + platform admin

## Broadcast subscriptions

- `workspace.{id}.lifecycle` — refresh workspace show + list on suspend / resume / archive
- `workspace.{id}.branding` — live preview on branding save
- `workspace.{id}.domain` — refresh domain list on DomainVerified / DomainVerificationFailed
- `workspace.{id}.integration` — refresh integration list on WorkspaceIntegrationSyncFailed
