# sports/drills — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; drill catalog pending

## Scope

Coaching drill library — the reusable exercises coaches assemble into sessions.
Attribute-driven per sport (a football drill has different metadata from a swim
drill).

## What landed

- Scaffolded model + `DrillInterface`.
- CRUD action stubs.

## What's pending

### Actions

- **`CreateDrillAction`** — coach or admin authored.
- **`AttachToSessionAction`** — POST /sessions/{session}/drills. Feeds the
  session's plan.
- **`ListMyDrillsAction`** — GET /drills?author=me.

### Services

- **`DrillLibraryImporter`** — bulk-import from CSV / vendor drill libraries.

### Cross-module dependencies

- **`sports/session`** — drills attach to sessions.
- **`sports/attribute-registry`** — sport-specific metadata schema.

## Backlog priorities

1. **P2 — CreateDrillAction + basic library**.
2. **P2 — AttachToSessionAction**.
