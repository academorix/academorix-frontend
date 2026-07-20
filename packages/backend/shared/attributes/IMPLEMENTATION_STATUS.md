# shared/attributes — Phase 3 implementation status

## Status: SCAFFOLDED — model + attribute-set primitives landed; every Action returns `null`

## What landed

- **`AttributeSet`** model — per-entity-type + per-sport-key attribute schemas
  (athletes have different attributes per sport; team formations have different
  fields per code, etc.).
- **`AttributeSetField`** — individual field definitions (name / widget /
  validation / default / bilingual labels).
- **`AttributeValue`** — polymorphic host attachment (`subject_type` +
  `subject_id`) — the actual per-record values.
- Enum types (`AttributeWidget`, `AttributeFieldType`).
- Attribute-first migrations, factories, permission seeder.
- `#[AsRepository]` repositories.

## What's pending

### Actions to complete

- **`CreateAttributeSetAction`** — POST `/attribute-sets`. Admin configuration
  for a new entity+sport combination.
- **`UpdateAttributeSetAction`** — versioning-aware: an existing set is
  immutable once used by a live host. Creates a new version instead of mutating.
- **`ListAttributeSetAction`** — GET `/attribute-sets`. Filter by
  `entity_type` + `sport_key`.
- **`ShowAttributeSetAction`** — GET `/attribute-sets/{id}`.
- **`DeleteAttributeSetAction`** — soft-delete only if unused.
- **`ActivateVersionAction`** — POST `/attribute-sets/{id}/activate`. Flip
  `is_active` to promote a version.
- **`ResolveAttributesAction`** — GET
  `/attribute-sets/resolve?entity_type=<t>&discriminator=<d>`. Returns the
  highest-version active set for a host. Called by the FE `useAttributeSet`
  hook.
- **`WriteAttributeValueAction`** — POST `/hosts/{type}/{id}/attributes`.
  Validated against the active set for the subject.
- **`ListAttributeValueAction`** — GET `/hosts/{type}/{id}/attributes`.

### Services to complete

- **`AttributeSchemaCompiler`** — compiles the `AttributeSetField` rows into a
  Laravel validation ruleset. Consumed by every write.
- **`AttributeResolver`** — the read-side. Merges the base entity's columns +
  attribute values into a single rendered record for the wire.
- **`AttributeSetVersionManager`** — enforces the immutability invariant (used
  sets can't mutate).
- **`AttributeMigrator`** — when a set version bumps and hosts need to migrate
  values, this service walks the delta.

### Cross-module dependencies

- **`sports/athlete`** — the primary consumer (sport-variable athlete
  attributes).
- **`sports/formations`** — same.
- **`sports/progress`** — same for skill-progression scoring.
- **`platform/forms`** — could reuse the widget catalogue.

## Backlog priorities

1. **P0 — `ResolveAttributesAction`** — the FE `useAttributeSet` hook depends on
   it.
2. **P0 — `WriteAttributeValueAction` + `AttributeSchemaCompiler`** — the write
   path.
3. **P1 — attribute-set CRUD** — admin surface.
4. **P1 — `AttributeSetVersionManager`** — immutability guard.
5. **P2 — `AttributeMigrator`** — needed only when the first attribute-set
   upgrade lands with breaking changes.
