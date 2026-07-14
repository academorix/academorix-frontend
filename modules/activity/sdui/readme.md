# activity — SDUI blueprints

## Surfaces

### `resources/activity/`

Workspace-facing activity feed.

- `list.screen.json` — filterable by log_name + subject_type + event + created_at. Regular users see own causer feed via a preset filter; admins see full workspace feed.

### `widgets/`

- `activity-log-entry.widget.json` — reusable row renderer showing causer avatar + description + subject link + relative timestamp. Consumed by activity list + dashboard "recent activity" panel + settings audit tab.
