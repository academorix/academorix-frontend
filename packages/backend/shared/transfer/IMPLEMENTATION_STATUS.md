# shared/transfer — Phase 3 implementation status

## Status: SCAFFOLDED — import + export models landed; Actions + adapters pending

## What landed

- **`Import`** — one row per import operation (file id + mode + status + row
  counts + failure count).
- **`ImportFailure`** — per-row failure records (row number + column errors
  JSON + subject reference).
- **`Export`** — one row per export operation (file id + query digest + row
  count).
- Enum types (`ImportMode`, `ImportStatus`, `ExportStatus`, `TransferFormat`).
- Attribute-first migrations, factories.
- Config file with `maatwebsite/excel` defaults.
- Blueprint-emitted Action stubs (every one returns `null`).

## What's pending

### Actions to complete

- **`StartImportAction`** — POST `/imports`. Kicks off an asynchronous import.
  Body: file id (from `platform/storage`), target model, mode (append / replace
  / upsert / dry-run). Returns the `Import` row for polling.
- **`PollImportAction`** — GET `/imports/{id}`. Status + progress.
- **`DownloadImportReportAction`** — GET `/imports/{id}/report`. CSV of
  `ImportFailure` rows for operator review.
- **`CancelImportAction`** — POST `/imports/{id}/cancel`. Halts the queued job.
- **`StartExportAction`** — POST `/exports`. Kicks off an export. Body: source
  model, filter criteria, format (csv / xlsx / json).
- **`PollExportAction`** — GET `/exports/{id}`. Status + percent-complete.
- **`DownloadExportAction`** — GET `/exports/{id}/download`. Signed URL to the
  completed file.
- **`ListImportAction`** / **`ShowImportAction`** — history.
- **`ListExportAction`** / **`ShowExportAction`** — history.

### Services to complete

- **`ImportOrchestrator`** — dispatches per-format import jobs.
- **`ExportOrchestrator`** — dispatches per-format export jobs.
- **`ImportableRegistry`** — attribute-driven registry of `#[Importable]` models
  with column-mapping rules.
- **`ExportableRegistry`** — similar, for exports.
- **`CsvReader` / `XlsxReader`** — format-specific parsers.
- **`ImportValidator`** — validates each row against the target model's Data DTO
  rules.
- **`UpsertResolver`** — for `mode=upsert`, identifies the unique-key match
  column(s).

### Jobs

- **`RunImportJob`** — the queued import processor. Streams the file in chunks;
  commits per-chunk transactions.
- **`RunExportJob`** — the queued export processor. Streams chunked reads →
  target file.
- **`PruneCompletedTransfersJob`** — cron: weekly. Drops completed
  `Import`/`Export` rows + their files after 30 days.

### Cross-module dependencies

- **`platform/storage`** — every transfer references a file id.
- **Every model with `#[Importable]` / `#[Exportable]` markers**.
- **`shared/localization`** — imports translation strings.
- **`shared/activity`** — activity-log exports.
- **`shared/audit`** — audit exports.

## Backlog priorities

1. **P0 — `StartImportAction` + `ImportOrchestrator` + `RunImportJob`** — the
   base import path. Blocks bulk-onboarding.
2. **P0 — `StartExportAction` + `ExportOrchestrator` + `RunExportJob`** — the
   base export path. Blocks DSAR + admin reporting.
3. **P0 — `ImportableRegistry` / `ExportableRegistry`** — model opt-in.
4. **P1 — `ImportFailure` reporting + `DownloadImportReportAction`** — operator
   UX for failed rows.
5. **P1 — `UpsertResolver`** — the "reimport with edits" path.
6. **P2 — `PruneCompletedTransfersJob`** — maintenance.
