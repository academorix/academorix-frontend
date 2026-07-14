# settings — SDUI blueprints

The admin settings UI is fully data-driven off the registry. One `list` screen navigates all groups; one `edit` screen per group renders the sections + fields via the reusable `setting-field-renderer` widget.

## Surfaces

### `resources/settings-group/`

- `list.screen.json` — sidebar of registered groups (filtered by permission) + a details panel that lazy-loads the current group's schema + values.
- `edit.screen.json` — per-group form. Reads schema via `/api/v1/settings/{group}/schema`; reads values via `/api/v1/settings/{group}`; submits via `PUT /api/v1/settings/{group}`.

### `widgets/`

- `setting-field-renderer.widget.json` — the workhorse. Takes a `FieldDescriptor` + current value; renders the correct HeroUI control based on `controlType`. Handles sensitive-field masking + reveal toggle + validation feedback.
