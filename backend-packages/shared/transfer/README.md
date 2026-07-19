# academorix/transfer

Enterprise-grade unified import/export engine for Academorix. Thin wrapper
around `maatwebsite/excel` — leverages its `->queue()` chain,
`WithChunkReading`, `WithBatchInserts`, `WithHeadings`, `WithMapping`,
`WithValidation`, `WithUpserts`, `SkipsFailures` verbatim — layered with
attribute-driven registration, an `xfer_jobs` domain record, error-artifact
writer, mode-based imports (append / upsert / replace / delete), sharded imports
for very large files, downloadable errors artifact for partial success, signed
download URLs, tenant scoping via `BelongsToTenant`, and per-user notifications
on completion.

Distinct from `activity` (product feed) and `audit` (compliance evidence) —
`transfer` runs the data-movement operations both of those modules observe.

## Aggregates

| Aggregate            | ULID prefix | Purpose                                                                                   |
| -------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `XferJob`            | `xjb_`      | The operation record — import / export / sample, mode, status, counters, notify channels. |
| `XferShard`          | `xshd_`     | Sub-job when a file is sharded — parent xfer_job id, shard index, status, counters.       |
| `XferArtifact`       | `xart_`     | File output — path, format, byte size, checksum, retention expires-at.                    |
| `XferMappingProfile` | `xmap_`     | Saved header remap profile per tenant per entity. Reusable across imports.                |

## Contributes

- **Attributes (8)** — `#[Importable]`, `#[Exportable]`, `#[SampleData]`,
  `#[ImportField]`, `#[ExportField]`, `#[TransferField]`,
  `#[ImportableWorkbook]`, `#[ExportableWorkbook]`.
- **Traits (2)** — `HasImportable`, `HasExportable`.
- **Bindings (9)** — `EntityRegistryInterface`, `WorkbookRegistryInterface`,
  `ImportManagerInterface`, `ExportManagerInterface`,
  `SampleDataGeneratorInterface`, `ArtifactStorageInterface`,
  `MappingProfileRepositoryInterface`, `NotificationChannelResolverInterface`,
  `SignedUrlSignerInterface` — every default impl ships; consumer apps override
  any binding via `#[Bind]` on the interface.
- **Events (10)** — `XferJobQueued`, `XferJobStarted`, `XferJobProgress`,
  `XferJobShardCompleted`, `XferJobCompleted`, `XferJobPartiallySucceeded`,
  `XferJobFailed`, `XferJobCancelled`, `XferArtifactPruned`,
  `SampleDataGenerated`.
- **Notifications (3)** — `XferJobCompletedNotification`,
  `XferJobPartiallySucceededNotification`, `XferJobFailedNotification`.
- **Jobs (11)** — `ImportEntityJob`, `ExportEntityJob`, `ImportShardJob`,
  `ExportShardJob`, `ImportCoordinatorJob`, `ExportCoordinatorJob`,
  `GenerateSampleDataJob`, `WriteErrorsArtifactJob`, `MarkXferJobCompletedJob`,
  `SendXferJobNotificationJob`, `PruneXferArtifactsJob`.
- **Observers (2)** — `XferJobObserver`, `XferShardObserver`.
- **Policies (2)** — `XferJobPolicy`, `XferMappingProfilePolicy`.
- **Casts (7)** — `ImportModeCast`, `ExportFormatCast`, `ImportFormatCast`,
  `XferJobStatusCast`, `XferJobCountersCast`, `NotifyChannelListCast`,
  `LookupByCast`.
- **Rules (5)** — `SupportedImportFormat`, `SupportedExportFormat`,
  `TransferModeAllowed`, `HeaderRowIndex`, `CsvSeparatorChar`.
- **Commands (8)** — `transfer:describe`, `transfer:import`, `transfer:export`,
  `transfer:sample`, `transfer:jobs`, `transfer:cancel`, `transfer:prune`,
  `transfer:verify`.
- **Permissions** — dual-guard (`sanctum` + `platform_admin`) via
  `TransferPermission`.

## Vendor wrap

Rides `maatwebsite/excel` verbatim: `->queue()`, `WithChunkReading`,
`WithBatchInserts`, `WithHeadings`, `WithMapping`, `WithValidation`,
`WithUpserts`, `SkipsFailures`, `FromQuery`, `FromCollection`,
`WithCustomChunkSize`, `WithCustomCsvSettings`, `WithMultipleSheets`,
`WithColumnWidths`, `WithColumnFormatting`. We never re-implement chunking or
queueing.

## Tests

```bash
composer install
vendor/bin/pest
```
