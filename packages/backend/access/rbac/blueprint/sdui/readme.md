# rbac — SDUI blueprints

## Surfaces

### `resources/role/`

Tenant + platform-admin role CRUD.

- `list.screen.json` — grouped by is_system (tenant-plane) or by application
  (platform-plane). Filterable by guard_name, is_system, name pattern. Owner +
  admin see the create button; other members see read-only.
- `show.screen.json` — role detail with permissions attached + principals
  holding it. Inline permission-attach picker for editable roles.
- `create.screen.json` — form for creating a custom role. Fields: name,
  description, sort_order, permissions[] (via the `permission-picker.widget`).

### `resources/permission/`

Tenant-facing permission catalogue (read-only for most tenants).

- `list.screen.json` — grouped by module_slug. Filter by guard_name,
  scope_suffix, resource. Shows which roles hold each permission (via a
  role_count chip).

### `widgets/`

- `permission-picker.widget.json` — the load-bearing widget on the role
  create/edit screens. Displays the full permission catalogue with filter +
  grouping + multi-select. Enforces the same RoleHasPermissionsObserver rules
  (guard + application boundary) at the client level so the user gets immediate
  feedback.
- `role-badge.widget.json` — colour-coded chip for a role's guard + is_system +
  tier gate.
- `permission-scope-chip.widget.json` — small badge showing the scope suffix
  (`.tenant`, `.branch`, `.own`, etc.) with an explanatory tooltip.
