# versioning — SDUI blueprints

Server-Driven UI for the versioning module. Two resource surfaces + one lifecycle widget.

## Surfaces

### `resources/api-version/`

Platform-admin CRUD for the ApiVersion registry. Tenant users see a read-only projection under the same resource.

- `list.screen.json` — filterable by state + scheme, actioned Menu per row (release / deprecate / sunset).
- `show.screen.json` — version detail with lifecycle timeline + affected subscription counts.
- `create.screen.json` — new draft version (super_admin only).
- `edit.screen.json` — metadata edits + inline migration_target selection.

### `resources/deprecation-notice/`

Platform-admin authoring surface for deprecation + sunset notices.

- `list.screen.json` — filterable by state + version.
- `show.screen.json` — notice detail with rendered markdown preview + notified-count.
- `create.screen.json` — new draft notice with markdown editor + affected endpoints/events multi-selects.

### `widgets/`

- `version-lifecycle-chip.widget.json` — colour-coded state chip (draft grey, released info, deprecated warning, sunset danger). Used in every listing + detail + downstream module rows referencing a version.

## Data sources

- `apiVersions` — full catalog paginated.
- `apiVersion` — single version with `include=deprecationNotices,migrationTarget`.
- `deprecationNotices` — notices paginated.
- `deprecationNotice` — single notice.
- `apiVersionsPublic` — the public / tenant read-only projection (excludes drafts + sunset).

## Broadcast subscriptions

None. Version lifecycle transitions are rare + tenant admins are notified via mail + in-app instead of live-updating dashboards.
