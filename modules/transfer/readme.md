# transfer

Enterprise-grade unified import / export engine. Wave 2 infrastructure. Wraps
`maatwebsite/excel` with our conventions: attribute-driven registration, a
persisted domain record for every operation, queue-by-default execution, and
per-user notifications on completion.

## 1. What this module owns

| Concern | Owned artefact |
| --- | --- |
| `HasImportable` / `HasExportable` traits (opt-in) | Composition traits models pull in when they carry the paired class attribute. Provide `->transferSchema()`, `->importScope()`, and observer wiring. |
| `#[Importable]` / `#[Exportable]` / `#[SampleData]` attributes | Class-level policy \u2014 formats, chunk size, mode default, permissions, i18n label. |
| `#[ImportField]` / `#[ExportField]` / `#[TransferField]` attributes | Class-repeatable field mapping targeting the Eloquent attribute name by string. |
| `#[ImportableWorkbook]` / `#[ExportableWorkbook]` attributes | Multi-sheet composition \u2014 an aggregate class references per-sheet models. |
| `XferJob` model + `xfer_jobs` table | The persisted operation record. Not a queue job \u2014 lives independently of the queue chain. |
| `XferShard` / `XferArtifact` / `XferMappingProfile` models | Per-shard progress rows, generated files (result / errors), saved header-remap profiles. |
| Workspace HTTP surface | `POST /api/v1/transfer/{imports,exports,samples}` + `GET /api/v1/transfer/jobs` + friends. |
| Platform-admin HTTP surface | `GET /api/v1/platform/transfer/jobs` \u2014 cross-workspace read for support triage. |
| Queue chain integration | Dispatches Laravel Excel's own `->queue()` chain + `WithChunkReading`; we chain `MarkXferJobCompletedJob` + `SendXferJobNotificationJob` on top. |
| Errors artifact writer | `WriteErrorsArtifactJob` composes an `errors.csv` (row + reason) linked from `xfer_job.errors_artifact_id`. |
| Retention prune | `PruneXferArtifactsJob` \u2014 files expire per config; the DB row survives longer for history. |

## 2. Transfer vs Activity vs Audit

Three adjacent but **distinct** modules that fire on overlapping signals:

| Dimension | `transfer` | `activity` | `audit` |
| --- | --- | --- | --- |
| Concern | Data movement (in / out) | Product feed \u2014 "who did what today?" | Compliance evidence \u2014 "prove this change occurred" |
| Audience | Workspace users initiating imports / exports | Workspace admins + end users | Compliance / DPO / regulators |
| Persistence | `xfer_jobs` + `xfer_shards` + `xfer_artifacts` + `xfer_mapping_profiles` | `activity_log` (spatie's table + our columns) | `audits` (owen-it's table + our columns) |
| Wrapped package | `maatwebsite/excel` | `spatie/laravel-activitylog` | `owen-it/laravel-auditing` |
| Retention | Files 7\u201330d; DB rows 90\u2013365d per plan | Tier-based 30 / 90 / 365d | 365d hot + 7y cold |
| HTTP surface | Workspace + platform-admin | Workspace + platform-admin | Platform-admin + workspace DPO |
| Volume | Low frequency, high row count | High frequency, low row count | Medium frequency, low row count |

They coexist without conflict. Every `xfer_job` transition also writes one
`activity_log` row (workspace sees "Alice imported 1,245 athletes") **and** one
`audits` row (DPO sees the immutable evidence). Row-level import errors do
**not** land in either \u2014 they land in the transfer errors artifact only.

## 3. Opting a model in

The whole developer surface is PHP attributes. No property declarations
required \u2014 Eloquent still owns `$attributes`. First argument to
`#[ImportField]` / `#[ExportField]` / `#[TransferField]` is always the
Eloquent attribute name.

```php
use Academorix\Transfer\Attributes\Exportable;
use Academorix\Transfer\Attributes\ExportField;
use Academorix\Transfer\Attributes\Importable;
use Academorix\Transfer\Attributes\ImportField;
use Academorix\Transfer\Attributes\SampleData;
use Academorix\Transfer\Attributes\TransferField;
use Academorix\Transfer\Concerns\HasExportable;
use Academorix\Transfer\Concerns\HasImportable;
use Academorix\Transfer\Enums\ImportMode;
use Academorix\Transfer\Support\LookupBy;

#[Importable(
    label:              ['en' => 'Athletes', 'ar' => '\u0627\u0644\u0631\u064a\u0627\u0636\u064a\u0648\u0646'],
    defaultMode:        ImportMode::Upsert,
    chunkSize:          500,
    batchSize:          500,
    requiredPermission: 'athletes.import',
)]
#[Exportable(
    label:              ['en' => 'Athletes', 'ar' => '\u0627\u0644\u0631\u064a\u0627\u0636\u064a\u0648\u0646'],
    chunkSize:          1000,
    autoSize:           true,
    requiredPermission: 'athletes.export',
)]
#[SampleData(factory: AthleteFactory::class, count: 25)]

#[TransferField('name',       column: 'Full Name',     order: 1, rules: 'required|string|max:255', example: 'Jane Doe')]
#[TransferField('email',      column: 'Email',         order: 2, rules: 'required|email',           unique: true)]
#[TransferField('birth_date', column: 'DOB',           order: 3, rules: 'required|date',            dateFormat: 'Y-m-d')]

#[ImportField('team_id',      column: 'Team',          rules: 'nullable|string',
              lookup: new LookupBy(Team::class, ['name'], scope: 'workspace', onMissing: 'error'))]
#[ExportField('team_id',      header: 'Team',          order: 4, valueFrom: 'team.name')]

final class Athlete extends Model
{
    use BelongsToWorkspace, HasUlids;
    use HasImportable, HasExportable;
}
```

You now get, without any additional wiring:

- `POST /api/v1/transfer/imports { entity: "athletes", file }` \u2014 queued import.
- `POST /api/v1/transfer/exports { entity: "athletes", format: "xlsx" }` \u2014 queued export.
- `POST /api/v1/transfer/samples { entity: "athletes", count: 100 }` \u2014 queued sample generation.
- `GET  /api/v1/transfer/templates/athletes?format=xlsx` \u2014 empty template with the four headers in `order` sequence.
- `GET  /api/v1/transfer/entities` \u2014 the athletes entry listed in the capabilities manifest.

## 4. Import modes

Every import request carries a `mode` (see `enums`). Default = `upsert`.
Overridable per-request. Enforced by policy \u2014 not every user may run
`replace` or `delete`.

| Mode | Behaviour |
| --- | --- |
| `append` | Insert new rows only. Row error `TRANSFER_DUPLICATE_ROW` on any hit against `#[ImportField(unique: true)]`. |
| `upsert` | Insert new + update existing per `unique: true` columns. Laravel Excel's `WithUpserts`. |
| `replace` | Soft-delete every row matching the request filter scope, then insert the file's rows. Wrapped in a transaction \u2014 rolled back on validation floor breach. |
| `delete` | Delete rows matched by `unique: true` columns in the file. Neutral counter columns (created / updated) stay at 0; `deleted` counter carries the total. |

## 5. Queue-by-default + `xfer_jobs`

Two distinct kinds of "job" \u2014 don't confuse them:

- **Laravel Excel queue jobs** = infrastructure. `->queue()` counts + chunks +
  dispatches N chained per-chunk jobs onto the queue. Executes the work.
- **`xfer_jobs` row** = domain record. The persisted operation. Owns status
  (`queued` / `running` / `succeeded` / `partially_succeeded` / `failed` /
  `cancelled`), counters, artifact links, resolved notification channels,
  retention deadline, and audit trail identity.

They compose like this:

```
POST /api/v1/transfer/imports
   \u25bc
ImportManager stores file, inserts xfer_job (status=queued),
resolves notify_channels + notify_locale, freezes them on the row,
constructs DynamicEntityImport (implements ShouldQueue + WithChunkReading + \u2026).

   \u25bc
(new DynamicEntityImport(...))
   ->queue($filePath, $disk)          // Laravel Excel builds the chain
   ->chain([
       new MarkXferJobCompletedJob($xferJobId),
       new SendXferJobNotificationJob($xferJobId),
   ])
   ->onQueue(config('transfer.queue.name', 'transfer'));

   \u25bc  (queue worker picks it up)

BeforeImport   \u2192 xfer_job.status = 'running'          broadcast XferJobStarted
\u2026N chunk jobs\u2026 \u2192 counters++ + XferJobProgress every N rows / percent
AfterImport    \u2192 collect SkipsFailures \u2192 WriteErrorsArtifactJob if any
MarkCompleted  \u2192 xfer_job.status = 'succeeded' | 'partially_succeeded'
                                                     broadcast XferJobCompleted
SendNotification \u2192 fan-out to notify_channels
```

On failure at any chunk, `AbstractDynamicImport::failed(Throwable)` runs
against the shared xfer_job id, sets status to `failed`, broadcasts
`XferJobFailed`, and dispatches the failure notification.

We never re-implement queueing or chunking. Every Laravel Excel queueing
capability (`->queue()`, `ShouldQueue`, chunk-per-chain-job, `->chain()`,
`->onQueue()`, `middleware()`, `HasLocalePreference`, `WithCustomQuerySize`,
remote temporary files, `force_resync_remote`) is used verbatim.

## 6. Notifications on finish

Every completed / partially-succeeded / failed job dispatches a Laravel
Notification through the `notifications` module. Channels resolve **once at
dispatch** and freeze on `xfer_job.notify_channels` so a user changing
preferences mid-run cannot game the delivery.

Resolution order:

1. `ImportRequestData.notifyChannels` / `ExportRequestData.notifyChannels`
   if the caller specified them.
2. Otherwise per-user setting `transfer.notify_channels` (settings module).
3. Otherwise workspace setting `transfer.default_notify_channels`.
4. Otherwise config default `['database', 'broadcast']`.

Three notification classes cover the exhaustive outcome space:
`XferJobCompletedNotification`, `XferJobPartiallySucceededNotification`,
`XferJobFailedNotification`. Cancellation is silent \u2014 the user did it.

## 7. Multi-sheet workbook composition

For files with several logically distinct sheets (roster + emergency contacts
+ medical), compose them at an aggregate class:

```php
#[ExportableWorkbook(
    label:   'Athlete Roster',
    sheets:  [AthleteSheet::class, EmergencyContactSheet::class, MedicalInfoSheet::class],
    formats: [ExportFormat::XLSX],
)]
final class AthleteRosterWorkbook {}

#[ExportableSheet(title: 'Athletes', modelClass: Athlete::class)]
final class AthleteSheet {}
```

Same pattern for `#[ImportableWorkbook]`. Each sheet's header row is matched
to that sheet's field map. One `xfer_job` covers the whole workbook; per-sheet
progress lives in `xfer_shards`.

## 8. Errors artifact + partial success

An import that ends with `xfer_job.counters.failed > 0` transitions to
`partially_succeeded`. The failure rows are serialised to a companion
`errors.csv` (original row + column + validation reason) uploaded to the
artifact disk, linked from `xfer_job.errors_artifact_id`, downloadable via
signed URL from `GET /api/v1/transfer/jobs/{jobId}/errors`. The user's
notification copy contains a "Download errors report" call-to-action for
this status only.

## 9. Retention & artifact cleanup

Two independent retention clocks:

| Kind | Default TTL | Purge job |
| --- | --- | --- |
| Artifact files (result / errors) | 7 days | `PruneXferArtifactsJob` deletes the file, nulls `xfer_job.result_artifact_id` / `errors_artifact_id`, sets `artifact_purged_at`. |
| `xfer_jobs` rows | 90 days (tier: `short`), 180 (`medium`), 365 (`long`) | Same job hard-deletes rows past the tier. |
| Cancelled + `queued` jobs abandoned > 24h | 24 hours | Auto-transition to `cancelled` \u2014 stale queue entries never resurface. |

Retention tier is set per plan via `entitlements.json`. Enterprise plans keep
history the full year; Free plans keep 90 days. The distinction is deliberate
\u2014 files are heavy, DB rows are light, so we prune them on different clocks.

## 10. What this module does NOT do

- **Not a live sync engine.** For ETL streaming to a warehouse or reverse-ETL
  writes to a CRM, look at future `integrations` and `warehouse` modules.
- **Not the notification transport.** `notifications-mail` /
  `notifications-push` / `notifications-in-app` deliver; transfer only
  authors the notification and delegates.
- **Not the audit trail.** `audit` module ingests our status transitions.
  Row-level import errors are not audit material \u2014 they live in the errors
  artifact.
- **Not a UI-schema engine.** Templates and mapping previews are data, not
  server-driven UI. Bespoke UX (columns, form layouts, buttons) lives in the
  frontend `transfer` module.

## 11. Migration from foundation

Foundation previously listed `Importable` / `Exportable` traits +
`importable` / `exportable` blueprint macros + `ImportContractRegistry` /
`ExportContractRegistry` container bindings + `ProcessImportBatchJob` /
`GenerateExportJob` jobs. All of it moved here on this module's inception.

Rationale: foundation is pure infrastructure with **zero domain entities**.
Import / export is a data-movement domain in its own right \u2014 it owns
entities (`xfer_jobs`, `xfer_shards`, `xfer_artifacts`,
`xfer_mapping_profiles`), HTTP surfaces, notifications, retention policies,
and third-party wrap semantics (`maatwebsite/excel`). Same rationale as
splitting `audit` and `activity` off from foundation instead of embedding
them there.

Rename map:

| Was | Now |
| --- | --- |
| `Academorix\Foundation\Concerns\Importable` | `Academorix\Transfer\Concerns\HasImportable` |
| `Academorix\Foundation\Concerns\Exportable` | `Academorix\Transfer\Concerns\HasExportable` |
| `Academorix\Foundation\Contracts\ImportContractRegistry` | `Academorix\Transfer\Contracts\EntityRegistryInterface` |
| `Academorix\Foundation\Contracts\ExportContractRegistry` | `Academorix\Transfer\Contracts\EntityRegistryInterface` (unified) |
| `Academorix\Foundation\Jobs\ProcessImportBatchJob` | `Academorix\Transfer\Jobs\ImportEntityJob` (+ shard variants) |
| `Academorix\Foundation\Jobs\GenerateExportJob` | `Academorix\Transfer\Jobs\ExportEntityJob` (+ shard variants) |
| `$table->importable()` blueprint macro | Removed. No macro needed \u2014 transfer's own tables live inside the module. |
| `$table->exportable()` blueprint macro | Removed. Same rationale. |

No production data touches these renames \u2014 the module is at inception
release. Consumer modules will need to import the new trait names when they
opt models into the transfer pipeline.
