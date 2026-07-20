# sports/registry — Phase 3 implementation status

## Status: SCAFFOLDED — SDUI substrate scaffolded; attribute-set catalog pending

## Scope

The sport-agnostic SDUI substrate. Attribute-driven rendering for sport-variable
fields on Athlete (positions per sport, playing preferences), Team (formation,
playing style), Session (drill categories), and Progress (skill matrix).

Reads from an `attribute_set` table keyed by (entity_type, discriminator_value,
version). Renders via HeroUI widgets in the FE: `select` → Select, `switch` →
Switch, `slider` → Slider, `number` → NumberField, `date` → DatePicker, `input`
→ TextField.

## What landed

- Scaffolded model + `RegistryInterface` (representing an AttributeSet).
- CRUD action stubs.

## What's pending

### Actions

- **`LoadAttributeSetAction`** — GET
  /attribute-sets?entity_type=X&discriminator=Y. Returns the highest-`version`
  set for the pair. Cached per (entity_type, discriminator, tenant_id).
- **`CreateAttributeSetAction`** — POST /attribute-sets. Payload: JSON schema of
  field definitions. Validated against a JSON-Schema meta-schema.
  Auto-increments version — never mutates an existing set.
- **`ListAttributeSetAction`**, **`ShowAttributeSetAction`**.
- **`PublishAction`** — POST /attribute-sets/{set}/publish. Idempotent version
  pin — flips the set from Draft to Published so it becomes the highest-version
  read by `LoadAttributeSetAction`.
- **`DeprecateAction`** — POST /attribute-sets/{set}/deprecate. Kept for read
  compatibility until purge.

### Services

- **`AttributeSetLoader`** — cached read.
- **`AttributeSetValidator`** — value validation against schema. Used by every
  Action that writes an entity carrying an `attributes: JSONB` column.
- **`AttributeSetVersionResolver`** — the highest-published-version rule.
- **`WidgetCatalogRegistry`** — maps schema widgets to renderer keys.

### Seeder

- **`AttributeSetSeeder`** — ships the default sport-specific attribute sets
  (football: position, foot-preference, playing-style; swimming: primary-stroke,
  race-distance, breathing-pattern; basketball: position, shooting-hand,
  court-role, ...).

### Cross-module dependencies

- Every module that carries an `attributes: JSONB` column (Athlete, Team,
  Session, Progress) consumes this module's loader.

## Backlog priorities

1. **P0 — AttributeSetSeeder** (default sport catalog).
2. **P0 — LoadAttributeSetAction + cache**.
3. **P0 — AttributeSetValidator** (used by every attribute-carrying Action's
   write path).
4. **P1 — Create + Publish + Deprecate lifecycle**.
