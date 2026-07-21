# foundation — module changelog

Auditor-friendly per-artefact changelog. Foundation is Wave 0 — every entry here
cascades to potentially every downstream module. Amendments require a
platform-wide compatibility note.

## 2026-07-14 — Module inception

- **inception** — folder `modules/foundation/` with the full blueprint artefact
  set MINUS `schemas/`, `relations.json`, `data/`, `sdui/` (entity- less by
  design).
- **owns: 9 model traits** — HasSystemFlag, HasUserstamps, HasAuditable,
  HasMetadata (all already implicitly consumed by tenants + invitations), plus
  Sortable, Filterable, Sluggable, Searchable, HasVectorEmbeddings (v2 stub).
- **owns: 8 migration macros** — paired with each trait. `->systemFlag()`,
  `->userstampable()`, `->auditable()`, `->metadata()`, `->sortable()`,
  `->sluggable('source')`, `->searchable()`, `->embeddings($dim)`.
- **owns: base HTTP primitives** — BaseData (spatie-data extension),
  BaseFormRequest, BaseController, CrudController, ResponseEnvelope,
  ApiException base class.
- **owns: base async primitives** — BaseJob (Sentry + tenants context),
  BaseRepository (spatie/query-builder integration), BaseService.
- **owns: module system** — ModuleRegistry (discovers modules/*/module.json),
  ModuleRouteLoader (mounts every module's routes.json centrally — this replaces
  per-module RouteServiceProviders and closes PLAN.md §8 Q1),
  ModuleServiceProviderDispatcher (dependency-ordered boot).
- **owns: health substrate** — HealthAggregator + HealthProbe interface + base
  probes (app-booted, db-connectivity, cache-connectivity, queue-connectivity).
- **owns: search substrate** — SearchEngineResolver (Meilisearch default,
  Elasticsearch / Postgres FTS / Typesense supported).
- **owns: 5 middleware** — api.version, request.id, response.envelope,
  throttle.base, cors.strict.
- **owns: reference taxonomies** — `compliance.json` (regime declarations every
  module inherits), `data-classes.json` (5-tier PII classification reference),
  `errors.json` (envelope contract + universal codes).
- **cache tag namespaces reserved** — `platform` + `foundation` are foundation-
  owned; every downstream module uses its own module-name tag.

## Compatibility note

Foundation defines the primitives every downstream module consumes. A breaking
change here — dropping a trait, renaming a macro, changing the error envelope —
is a platform-wide breaking change. Bump `foundation.$version`

- every dependent module simultaneously; document the migration path in the
  per-module changelog.

## 2026-07-14 — Import / export substrate moved to `modules/transfer/`

Wave 2 module inception (`modules/transfer/`) takes ownership of the CSV / Excel
/ PDF / JSON import + export domain. Foundation kept placeholders for this
substrate at inception; they retire here.

- **removed traits** — `Importable`, `Exportable` (both moved to
  `Stackra\Transfer\Concerns\HasImportable` /
  `Stackra\Transfer\Concerns\HasExportable`). Foundation trait count drops from
  11 (as originally counted in the inception entry) to 9.
- **removed blueprint macros** — `->importable()`, `->exportable()` (retired;
  transfer discovers via PHP attributes, not migration markers). Blueprint count
  drops from 10 to 8.
- **removed jobs** — `Stackra\Foundation\Jobs\ProcessImportBatchJob`,
  `Stackra\Foundation\Jobs\GenerateExportJob`. Transfer uses
  `maatwebsite/excel`'s own `->queue()` chain + our shard coordinator on top, so
  it does not consume a foundation-level base job.
- **removed bindings** — `ImportContractRegistry`, `ExportContractRegistry`
  (folded into transfer's `EntityRegistry` + `WorkbookRegistry`). Binding count
  drops from 6 to 4.
- **removed queues** — `imports` and `exports` (transfer defines its own
  `transfer` queue in `config/transfer.php`).

### Compatibility

- Wave 2 breaking rename against inception. No production data touches the
  rename \u2014 both foundation and transfer are pre-release.
- Consumer modules opting a model into imports / exports **must** add `transfer`
  to their `dependencies` and switch:
  - `use Stackra\Foundation\Concerns\Importable;` \u2192
    `use Stackra\Transfer\Concerns\HasImportable;`
  - `use Stackra\Foundation\Concerns\Exportable;` \u2192
    `use Stackra\Transfer\Concerns\HasExportable;`
- Migration files remove `->importable()` and `->exportable()` marker calls.
  Transfer discovers importable / exportable models by scanning `#[Importable]`
  / `#[Exportable]` PHP attributes on the model class, not via schema-side
  annotations.
- Foundation's `traits.json`, `jobs.json`, `readme.md`, and `module.json`
  updated in this pass; no other foundation files reference the moved entries.
