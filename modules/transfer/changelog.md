# transfer — changelog

## [Unreleased] — inception

- Transfer engine module authored. Wraps `maatwebsite/excel`.
- Publishes 8 PHP attributes: `#[Importable]`, `#[Exportable]`, `#[SampleData]`,
  `#[ImportField]`, `#[ExportField]`, `#[TransferField]`, `#[ImportableWorkbook]`,
  `#[ExportableWorkbook]`.
- Publishes `HasImportable` + `HasExportable` opt-in composition traits.
- Ships four import modes: `append`, `upsert`, `replace`, `delete`.
- Ships `xfer_jobs` + `xfer_shards` + `xfer_artifacts` + `xfer_mapping_profiles`
  entities \u2014 the persisted operation record, distinct from Laravel Excel's
  queue chain.
- Queue-by-default: every import / export / sample rides Laravel Excel's
  `->queue()` chain + `WithChunkReading`. We chain `MarkXferJobCompletedJob` +
  `SendXferJobNotificationJob` on top.
- Notifications on finish through the `notifications` module. Channels
  (`mail` / `broadcast` / `database` / `push`) resolved once at dispatch and
  frozen on the row.
- Tenant HTTP surface at `/api/v1/transfer/*` (imports, exports, samples,
  jobs, mapping profiles, templates, entities, downloads).
- Platform-admin HTTP surface at `/api/v1/platform/transfer/*` for cross-tenant
  support triage.
- Sharded imports + shard-level retry (`POST /jobs/{id}/retry-shard`).
- Errors artifact writer produces a downloadable `errors.csv` for
  `partially_succeeded` jobs.
- Signed download URLs for result + errors artifacts.
- Tier-based retention: files (7d), rows (90 / 180 / 365d per plan).
- Every status transition writes an activity row (`activity` module) and an
  audit row (`audit` module).

### Compatibility

- Depends on `foundation`, `tenancy`, `audit`, `activity`, `notifications`,
  `settings`.
- **Breaking rename against foundation.** Foundation's earlier
  `Importable` / `Exportable` traits + `importable` / `exportable` blueprint
  macros + `ImportContractRegistry` / `ExportContractRegistry` bindings +
  `ProcessImportBatchJob` / `GenerateExportJob` jobs moved to this module.
  See `readme.md` \u00a7 11 for the full rename map. No production data touches
  the rename \u2014 module is at inception.
- Consumer modules must add `transfer` to their `dependencies` before opting
  a model into the import / export pipeline.
