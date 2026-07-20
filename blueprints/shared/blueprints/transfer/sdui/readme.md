# transfer — SDUI blueprints

## Surfaces

### `resources/xfer-job/`

Tenant-facing job history + control.

- `list.screen.json` — filterable by status + kind + entity + created_at.
  Regular users see own jobs via preset filter (initiator = auth); tenant admins
  with `platform.transfer.viewAny` see the tenant-wide view.
- `show.screen.json` — one job's detail page: header (entity + status + counters
  progress bar), shards table, artifact download buttons, cancel button (when
  queued / running), retry-shard buttons (when partially_succeeded / failed).

### `resources/xfer-mapping-profile/`

- `list.screen.json` — mapping profiles the caller owns or that are shared
  tenant-wide. Create / edit / delete + mark-as-shared actions.

### `widgets/`

- `xfer-job-row.widget.json` — reusable row for the jobs list: entity + status
  chip + counters + relative timestamp + row actions. Consumed by the jobs list
  screen and the dashboard "Recent transfers" panel.
- `xfer-job-status-chip.widget.json` — colored status pill. Palette:
  queued=neutral, running=info, succeeded=success, partially_succeeded=warning,
  failed=danger, cancelling=warning, cancelled=neutral.
- `xfer-job-progress.widget.json` — progress bar with counter breakdown (created
  / updated / skipped / failed). Live-updates via the `user.{userId}.transfer`
  broadcast channel.

## Import / export flows

The **initiate-import** and **initiate-export** workflows are frontend-owned
(bespoke UX with file picker, mapping preview, format selector). They're not
declared as SDUI screens — that is by design per the frontend module
architecture doctrine ("frontend owns screens, backend owns capability
manifest"). The `GET /api/v1/transfer/entities` endpoint provides the manifest
those frontend screens consume; nothing more.
