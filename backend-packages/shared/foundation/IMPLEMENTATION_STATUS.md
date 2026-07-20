# shared/foundation — Phase 3 implementation status

## Status: FRAMEWORK-TIER — base classes + concerns landed; module is per-Phase-3 hygiene rather than feature completion

## Purpose

Foundation is the framework-tier substrate every domain package
depends on. It ships base classes (repository, service,
controller helpers), cross-cutting concerns (`Filterable`,
`HasMetadata`), audit + soft-delete integration helpers, and
the discovery contracts (`DiscoversAttributes`).

## What landed

Foundation is a framework-tier package (Group F per
`tasks-backend-orchestration.md`). Its Phase-3 concern is
standards + tests, NOT feature completion. The following
components are in place:

- `Concerns/BelongsToTenantOptional` — nullable-tenant trait.
- `Concerns/Filterable` — request-driven filter attribute
  helper.
- `Concerns/HasMetadata` — spatie waad/laravel-model-metadata
  wrapper.
- `Concerns/HasPrefixedUlid` — ULID-with-prefix key generator.
- Base `Repository`, `Data`, `Enum` primitives.
- Discovery contracts + `DiscoversAttributes` implementation.

## What's pending

Foundation's outstanding work is NOT feature-implementation.
Phase-4 hygiene + Phase-5 test coverage + Phase-6 docs are
the appropriate lanes.

## Cross-module dependencies

Every other package under `backend-packages/` depends on
foundation (either directly or transitively via `crud` /
`routing` / etc.).

**Note:** this module is renamed to `academorix-shared/foundation`
(commit `6d791aea6`).
