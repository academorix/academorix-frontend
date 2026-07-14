# audit — SDUI blueprints

## Surfaces

### `resources/audit/`

Platform admin surface + minimal workspace DPO surface.

- `list.screen.json` — filterable by workspace + auditable_type + event + date range. Restricted-tier field values masked for non-privileged callers.
- `show.screen.json` — audit detail with side-by-side old/new value diff via the AuditDiffViewer widget.

### `widgets/`

- `audit-diff-viewer.widget.json` — side-by-side JSON diff of old_values vs new_values. Highlights restricted fields with a lock icon; shows `[REDACTED]` when caller lacks audit.view-restricted permission.
