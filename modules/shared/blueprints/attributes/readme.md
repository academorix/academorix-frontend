# attributes

The sport-agnostic EAV substrate. Wave 0 foundational module — the backbone of
mechanism #3 in the domain blueprint (§6 sport-agnostic strategy).

## 1. What this module owns

| Concern         | Owned artefact                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Typed field     | `AttributeDefinition` (`ads_`) — one row per code + type + widget + validation + bilingual labels + deprecation flag.       |
| Versioned set   | `AttributeSet` (`asg_`) — collection of definitions grouped for `(entity_type, discriminator_value)` with `version_number`. |
| Visual grouping | `AttributeGroup` (`atg_`) — Primary Stats / Detailed Skills / Position / Physical Profile within a set.                     |
| Values (JSONB)  | NOT a row-per-value table — values persist on the host entity via `spatie/laravel-schemaless-attributes`.                   |

## 2. The two-layer split

Per blueprint §5, every sport-aware surface splits into behaviour (code) + data
(attribute set):

```
Sport Registry (CODE)                Attribute Set (DATA)
  terminology / capabilities /         typed fields per sport:
  scoring strategy / field type          football → PAC/SHO/PAS/DRI/DEF/PHY
                                         swimming → 50m PB / 100m PB / stroke
                                         karate   → belt rank / kata mastery
```

`AttributableEntityRegistry` binds host entity types to their discriminator
column via the `#[AttributableEntity]` attribute:

```php
#[AttributableEntity(entityType: 'athlete_enrollment', discriminator: 'sport_key', valuesColumn: 'attributes')]
final class AthleteEnrollment extends Model
{
    use HasAttributeSet;
    // …
}
```

At runtime the resolver picks the active AttributeSet for
`(entity_type=athlete_enrollment, discriminator_value=football)`, validates the
JSONB `attributes` column against every definition, and renders the widgets.

## 3. Why JSONB, not row-per-value

The reference domain used a `commerce-attributes` package with attribute-value
rows keyed per (entity, attribute). It joins explode at scale — the classic
[EAV row-per-value anti-pattern](https://levelup.gitconnected.com/eav-a-fascinating-and-dangerous-anti-pattern-acd922196159).
We store values in ONE `JSONB` column on the host via
`spatie/laravel-schemaless-attributes`, index the whole document with a GIN
index, and project the two or three columns we actually filter on (e.g.
`primary_position`) into generated columns.

Definitions + sets + groups stay relational (queryable, versionable, seedable
from tenant admin). Values are cheap JSONB.

## 4. Versioning strategy

An AttributeSet has a monotonic `version_number` per
`(entity_type, discriminator_value)`. Breaking changes create a NEW version and
supersede the old one:

- **Breaking** — required field added, field removed, type changed, validation
  tightened. Requires new version.
- **Non-breaking** — label change, description change, widget hint change,
  deprecating a field (which stays for historic render). No version bump.

Historic records freeze the `version_number` at capture time via a
`set_version_snapshot` column on the host — so a 2023 assessment rendered in
2026 still shows the fields that existed in 2023.

`AttributeSetVersioned` event fires; the resolver caches the latest active
version per (entity_type, discriminator_value).

## 5. Widgets

| Widget     | Type support                   | Config keys                      |
| ---------- | ------------------------------ | -------------------------------- |
| `select`   | select                         | options[], multiple, placeholder |
| `slider`   | integer / decimal / percentage | min, max, step, marks[]          |
| `number`   | integer / decimal              | min, max, step                   |
| `date`     | date                           | min, max, format                 |
| `input`    | text                           | placeholder, maxLength, pattern  |
| `switch`   | boolean                        | trueLabel, falseLabel            |
| `textarea` | text                           | rows, maxLength                  |
| `radio`    | select                         | options[], layout (row/column)   |

The frontend `AttributeForm` / `AttributeField` / `AttributeView` map these
directly onto HeroUI primitives (Select / Slider / Input / DatePicker / Switch /
TextArea / RadioGroup) via `@stackra/ui/react`.

## 6. Labels + i18n

Every AttributeDefinition and AttributeGroup carries a `labels` JSONB with at
least `en` and optionally `ar` (RTL-ready). Missing translations fall back to
`en`.

## 7. Cascades

- `attribute_definitions` → CASCADE from `tenants`. RESTRICT on delete when the
  definition is referenced by any active AttributeSet.
- `attribute_sets` → CASCADE from `tenants`. Old versions preserved after
  supersession — they're the render source for historic values.
- `attribute_groups` → CASCADE from `attribute_sets`. Deleting a set removes its
  groups.
- `TenantErased` → cascade delete via FK.

## 8. Downstream hosts (planned consumers)

Modules that declare `#[AttributableEntity]` and consume an AttributeSet:

| Module               | Entity                           | Discriminator                         |
| -------------------- | -------------------------------- | ------------------------------------- |
| `athlete-enrollment` | AthleteEnrollment.attributes     | `sport_key` (football / swimming / …) |
| `progress`           | ProgressAssessment.values        | `sport_key`                           |
| `performance`        | PerformanceTestResult.metrics    | `sport_key`                           |
| `medical`            | MedicalClearance.details         | `sport_key`                           |
| `development`        | DevelopmentPathwayStage.criteria | `sport_key`                           |
| `drills`             | Drill.tags                       | `sport_key`                           |

## 9. What this module does NOT do

- **Host values.** Values live on the host entity's JSONB column — this module
  only owns definitions / sets / groups + resolution.
- **Cross-sport analytics.** That's `growth::analytics` reading aggregated
  metrics.
- **UI rendering.** The `@stackra/ui` `AttributeForm` component consumes the
  resolved set + values; this module owns the CONTRACT, the frontend owns the
  render.
- **Attribute-driven access control.** Access is RBAC + scoped grants (per
  `access/rbac`).

## 10. ULID prefixes owned

- `ads_` — AttributeDefinition
- `asg_` — AttributeSet
- `atg_` — AttributeGroup

Register in `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.
Consumed (via FK): `ten_`.
