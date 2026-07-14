# foundation — module changelog

Auditor-friendly per-artefact changelog. Foundation is Wave 0 — every entry
here cascades to potentially every downstream module. Amendments require a
platform-wide compatibility note.

## 2026-07-14 — Module inception

- **inception** — folder `modules/foundation/` with the full blueprint
  artefact set MINUS `schemas/`, `relations.json`, `data/`, `sdui/` (entity-
  less by design).
- **owns: 11 model traits** — HasSystemFlag, HasUserstamps, HasAuditable,
  HasMetadata (all already implicitly consumed by tenancy + invitations),
  plus Sortable, Filterable, Sluggable, Searchable, Importable, Exportable,
  HasVectorEmbeddings (v2 stub).
- **owns: 10 migration macros** — paired with each trait. `->systemFlag()`,
  `->userstampable()`, `->auditable()`, `->metadata()`, `->sortable()`,
  `->sluggable('source')`, `->searchable()`, `->importable()`,
  `->exportable()`, `->embeddings($dim)`.
- **owns: base HTTP primitives** — BaseData (spatie-data extension),
  BaseFormRequest, BaseController, CrudController, ResponseEnvelope,
  ApiException base class.
- **owns: base async primitives** — BaseJob (Sentry + tenancy context),
  BaseRepository (spatie/query-builder integration), BaseService.
- **owns: module system** — ModuleRegistry (discovers modules/*/module.json),
  ModuleRouteLoader (mounts every module's routes.json centrally — this
  replaces per-module RouteServiceProviders and closes PLAN.md §8 Q1),
  ModuleServiceProviderDispatcher (dependency-ordered boot).
- **owns: health substrate** — HealthAggregator + HealthProbe interface +
  base probes (app-booted, db-connectivity, cache-connectivity,
  queue-connectivity).
- **owns: search substrate** — SearchEngineResolver (Meilisearch default,
  Elasticsearch / Postgres FTS / Typesense supported).
- **owns: import + export substrates** — ImportContractRegistry +
  ExportContractRegistry (per-model contract registration).
- **owns: 5 middleware** — api.version, request.id, response.envelope,
  throttle.base, cors.strict.
- **owns: reference taxonomies** — `compliance.json` (regime declarations
  every module inherits), `data-classes.json` (5-tier PII classification
  reference), `errors.json` (envelope contract + universal codes).
- **cache tag namespaces reserved** — `platform` + `foundation` are foundation-
  owned; every downstream module uses its own module-name tag.

## Compatibility note

Foundation defines the primitives every downstream module consumes. A
breaking change here — dropping a trait, renaming a macro, changing the
error envelope — is a platform-wide breaking change. Bump `foundation.$version`
+ every dependent module simultaneously; document the migration path in the
per-module changelog.
