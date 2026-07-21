# organization — SDUI blueprints

## Surfaces

### `resources/organization/`

Tenant-facing Organization management.

- `list.screen.json` — filterable + sortable table. Two view modes: flat list
  (default) and tree view (indented). Row actions: view, edit, reparent,
  set-default, pause/resume, archive.
- `create.screen.json` — 12-field create form. Branding fields are conditional
  on the `organization_branding` entitlement. `parent_id` selector is
  conditional on `organization_hierarchy`.
- `tree.screen.json` — full-page tree renderer with drag-and-drop reparent
  (Enterprise + `organization_reparent` entitlement). Non-Enterprise tenants see
  the tree in read-only mode.

### `widgets/`

- `org-picker.widget.json` — the tenant sidebar picker. Renders as a searchable
  `ComboBox` (per ui-components rule) grouped by parent when nesting is used.
  Selecting an Organization writes it to the user's profile
  (`default_organization_id`) and reloads.

## Notes on `ComboBox` over `Select`

The org-picker uses HeroUI `ComboBox` (not `Select`) per the ui-components rule
— a tenant may have up to 100 Organizations on Enterprise, and free-text search
is essential at that scale. Even single-brand tenants get the searchable UX for
free.
