# age-group

Age-bucket classifier for Athletes + Teams. Owns `AgeGroup` — the row that
answers "is this Athlete eligible for this Team's age category?". Ships the
10-entry default catalog (U6..U18, Adult, Senior, Masters), the eligibility
resolver, and the trait every downstream domain aggregate uses to reference an
age group. Wave 3a of the sports tier (priority 53).

## 1. What this module owns

| Concern                        | Owned artefact                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Age-bucket classifier          | `AgeGroup` (`age_groups.tenant_id` + nullable `organization_id`) — bounds + cutoff config + is_youth                       |
| Default catalog                | `data/default-age-groups.json` — 10-entry seeded catalog (U6..Masters) dispatched on TenantProvisioned                     |
| Sport-cutoff reference         | `data/sport-cutoff-samples.json` — canonical per-sport cutoff patterns from public federation docs (advisory)              |
| Auto-provisioning              | `SeedDefaultAgeGroupsForTenantJob` — dispatched on tenancy::TenantProvisioned; idempotent                                  |
| Default-per-tuple invariant    | Exactly one `is_default=true` per (tenant_id, organization_id, sport_key), enforced by observer + reconciler               |
| Tenant surface                 | Full CRUD on `/api/v1/age-groups` + lifecycle (`set-default`, `archive`, `restore`) + hypothetical resolver                |
| Platform-admin surface         | Cross-tenant read (`/api/v1/platform/age-groups`)                                                                          |
| `BelongsToAgeGroup` trait      | For Team (Wave 2b), EventDivision (Wave 3+), TeamRegistration (Wave 3+)                                                    |
| `HasAgeGroupCatalog` trait     | On Tenant — sibling accessors + catalog rollups                                                                            |
| `AgeGroupResolver` service     | `resolveFor(dob, sport_key = null, on_date = today)` — the eligibility resolution primitive                                |
| `CutoffDateCalculator` pure fn | Given (kind, month, day, birthday, on_date), returns the effective age                                                     |
| Entitlement gates              | `age_group_custom` (Medium+), `age_group_slot` (Small=0, Medium=20, Enterprise=∞), `age_group_sport_specific` (Enterprise) |

### 1.1 AgeGroup is orthogonal to Region + Branch

AgeGroup carries `tenant_id` (CASCADE) + optional `organization_id` (RESTRICT,
nullable). It does NOT carry `region_id` or `branch_id` — eligibility rules
apply uniformly across every region and every branch of a tenant. A U12 group
means the same thing whether the athlete plays in Dubai or Riyadh, and whether
they train at Downtown or Marina.

The organization_id FK is nullable to support two shapes:

- **`organization_id IS NULL`** — tenant-wide age group. Applies across every
  Organization the tenant runs. This is the default shape (the 10 seeded rows
  all have organization_id=NULL).
- **`organization_id IS NOT NULL`** — brand-scoped age group. A tenant running
  two brands (`Elite Academy` + `Community Program`) may need different U12
  rules per brand (tighter cutoff for Elite; broader window for Community).
  Enterprise-scoped by convention (Medium tenants rarely need this).

### 1.2 The three flags: is_default, is_seeded, is_youth

Three booleans, three different jobs:

- **`is_default`** — exactly one per (tenant, organization, sport_key) tuple.
  Marks the tenant's fallback/preferred group. Drives tier-pricing defaults
  (Finance Wave 4).
- **`is_seeded`** — true when the row was created by the platform seeder.
  IMMUTABLE. Distinguishes platform-baseline rows (cannot be deleted, may be
  edited within entitlements) from tenant customs (subject to age_group_slot
  cap; may be archived + deleted).
- **`is_youth`** — DERIVED from `max_age_inclusive < 18`. Stored on the row for
  indexed filtering (safeguarding queries, minor-consent banners, retention
  windows on child data). Set by the observer; caller writes are silently
  overridden.

### 1.3 The four cutoff kinds

`cutoff_date_kind` picks how the CutoffDateCalculator resolves an athlete's
effective age:

| Kind                    | How age is computed                                                       | Requires cutoff_month | Requires cutoff_day |
| ----------------------- | ------------------------------------------------------------------------- | --------------------- | ------------------- |
| `calendar_year`         | age = year_of_resolution - year_of_birth (Jan 1 cutoff)                   | No (must be NULL)     | No (must be NULL)   |
| `academic_year`         | age = year_of_academic_start - year_of_birth (Sep 1, etc.)                | Yes (1-12)            | No (defaults to 1)  |
| `rolling_from_birthday` | age = actual age in years on resolution date                              | No (must be NULL)     | No (must be NULL)   |
| `custom_date`           | age = year_of_resolution_if_before_cutoff_else_year_after - year_of_birth | Yes (1-12)            | Yes (1-31)          |

The choice matters. A football club in Ireland picks `custom_date` with cutoff
Jan 1 (UEFA rule). A US Soccer club picks `custom_date` with cutoff Aug 1. A
swim club picks `rolling_from_birthday` (World Aquatics rule). A school picks
`academic_year` with September cutoff. See `data/sport-cutoff-samples.json` for
canonical samples from public federation documentation.

## 2. The row-level attribution contract

AgeGroup carries `tenant_id` + optional `organization_id` ONLY. Per
`.kiro/steering/tenancy-columns.md` §3 + §5:

- ✅ `age_groups.tenant_id` — required, FK to `tenants.id`, `onDelete=cascade`
- ✅ `age_groups.organization_id` — optional (nullable), FK to
  `organizations.id`, `onDelete=restrict`
- ❌ `age_groups.application_id` — FORBIDDEN. Application cascades through
  `tenants.application_id` (age groups are NOT one of the 8 rows in §2 that
  carry `application_id` directly).
- ❌ `age_groups.region_id` — FORBIDDEN. Eligibility rules apply uniformly
  across regions.
- ❌ `age_groups.branch_id` — FORBIDDEN. Same reasoning — U12 is U12 across
  every branch.
- ❌ `age_groups.scope_node_id` — FORBIDDEN. AgeGroup is a scope-node entity
  (referenced BY scope nodes via `entity_id`), not a scope consumer.
- ❌ `age_groups.parent_id` — FORBIDDEN. Age groups are flat per scoping tuple;
  numeric bounds establish ordering.

Cross-tenant FKs from AgeGroup to any other aggregate are forbidden.

## 3. Tier boundaries

Per `hierarchy.md` §7 tier matrix + this module's entitlements:

| Tier       | Seeded catalog | Custom groups             | Sport-specific overrides |
| ---------- | -------------- | ------------------------- | ------------------------ |
| Small      | ✅ (10 rows)   | ❌ (age_group_custom off) | ❌                       |
| Medium     | ✅             | ✅ up to 20               | ❌                       |
| Enterprise | ✅             | ✅ unlimited              | ✅                       |

Backed by three entitlements:

- **`age_group_custom`** (boolean) — enables custom (is_seeded=false) creates.
  Off = tenant locked to the seeded catalog entirely; POST returns
  AGE_GROUP_CUSTOM_DISABLED (402).
- **`age_group_slot`** (slot) — quantity cap on customs. Consumed on
  is_seeded=false create. Small=0, Medium=20, Enterprise=null (unlimited).
  Seeded rows do NOT consume slots.
- **`age_group_sport_specific`** (boolean) — enables the sport_key column.
  Enterprise-only.

Downgrading (Enterprise → Medium) does NOT auto-clear sport_key values (that
would silently reshape resolution answers). Downgrading (Medium → Small) does
NOT auto-archive existing customs. The entitlement reconciler surfaces the drift

- suggests a manual archive path.

## 4. The default catalog

The 10-entry seeded catalog covers the standard youth-development progression

- adult/senior/masters divisions. Every entry has `sport_key=null` (generic —
  applies across every sport) and `organization_id=null` (tenant-wide):

| Name    | Bounds | Cutoff kind           | is_youth | is_default |
| ------- | ------ | --------------------- | -------- | ---------- |
| U6      | 3-5    | calendar_year         | ✅       | ❌         |
| U8      | 6-7    | calendar_year         | ✅       | ❌         |
| U10     | 8-9    | calendar_year         | ✅       | ❌         |
| U12     | 10-11  | calendar_year         | ✅       | ❌         |
| U14     | 12-13  | calendar_year         | ✅       | ❌         |
| U16     | 14-15  | calendar_year         | ✅       | ❌         |
| U18     | 16-17  | calendar_year         | ✅       | ❌         |
| Adult   | 18-34  | rolling_from_birthday | ❌       | ✅         |
| Senior  | 35-100 | rolling_from_birthday | ❌       | ❌         |
| Masters | 50-100 | rolling_from_birthday | ❌       | ❌         |

`Adult` is is_default=true so downstream code (Finance tier-pricing defaults,
enrollment previews) always has a working answer for the (tenant, null, null)
tuple.

Overlap between `Senior` (35-100) and `Masters` (50-100) is intentional —
Masters is the competitive sub-set of Senior. The resolver's indeterminate
strategy (default: refuse) forces callers to disambiguate when a 55-year-old
enrolls without a sport_key selecting between the two.

## 5. Lifecycle timeline

```
[created]  is_seeded=false (custom) OR is_seeded=true (platform seeder)
    ↓
[edited]   name, description, color, sort_order (any tier)
           bounds + cutoff (bounds/cutoff edit permissions + age_group.edit_seeded for seeded rows on Medium+)
           sport_key (age_group_sport_specific entitlement, Enterprise only)
    ↓ (archive — refused when is_default OR is_seeded OR in-use)
[archived] soft-deleted (deleted_at set); hidden from selectors + resolver
    ↓ (restore within 1095 days)
[active]
    ↓ (retention expires; PurgeArchivedAgeGroupsJob runs)
[hard-deleted]  fires AgeGroupDeleted { mode: 'hard' }
                audit row survives 7 years (minor-safeguarding retention)
```

Three guardrails:

- **`is_default=true` cannot be deleted / archived.** Every scoping tuple must
  have exactly one default. Promote another AgeGroup first
  (`CANNOT_DELETE_DEFAULT_AGE_GROUP` 409).
- **`is_seeded=true` cannot be deleted / archived.** The platform's baseline
  catalog must remain intact. Seeded rows may still be edited (rename, recolour,
  bounds edits within entitlements). `CANNOT_DELETE_SEEDED_AGE_GROUP` 409.
- **AgeGroups in use cannot be archived / deleted.** Any inbound
  Team.age_group_id or EventDivision.age_group_id blocks the write with
  `AGE_GROUP_IN_USE` (409). AthleteEnrollment.age_group_snapshot_id does NOT
  count — snapshots are self-contained copies.

## 6. Snapshotting on AthleteEnrollment (Wave 3+)

`AthleteEnrollment.age_group_snapshot_id` is intentionally SNAPSHOTTED — it
stores the age_group_id + a JSONB copy of the bounds + cutoff at enrollment
time. Two motivations:

1. **Bounds drift.** If a tenant edits U12's bounds from 10-11 to 11-12
   mid-season, currently-enrolled athletes should not silently lose eligibility.
   The snapshot preserves the enrollment's original eligibility posture.
2. **Athlete birthday drift.** An athlete who was 11 when enrolled becomes 12
   during the season. Their competitive eligibility for the season shouldn't
   change — the snapshot preserves the age they were when enrolled.

Because snapshots are self-contained copies, they do NOT create RESTRICT FKs on
the source AgeGroup. Archiving or deleting an AgeGroup that has ONLY snapshot
references is permitted (assuming no live Team.age_group_id references remain).

## 7. What this module does NOT do

- **Doesn't own athletes.** Athletes are in the `athlete` module (Wave 3+); the
  AgeGroupResolver operates on a DOB argument, not on an Athlete row.
- **Doesn't own teams.** Teams are in the `teams` module (Wave 2b); Team carries
  `age_group_id` (nullable) via the `BelongsToAgeGroup` trait shipped here.
- **Doesn't compute eligibility against real athlete records.** The resolver
  answers "what group does this DOB fall into?" — the downstream Athlete +
  AthleteEnrollment modules make the actual eligibility decisions using the
  resolver's answer + tenant policy.
- **Doesn't ship a sports registry.** `sport_key` accepts any
  syntactically-valid string in Wave 3a. Wave 3c will introduce a registered
  sports catalogue + tighten valid_sport_key validation.
- **Doesn't clone age groups.** Each tenant creates their own via the seeder
  - admin CRUD. Cross-tenant cloning is forbidden.
- **Doesn't nest.** No `parent_id` — age groups are flat. Programs that nest
  (e.g. "Junior Program" → U12 + U14) live in a future `programme` aggregate
  that references age groups by FK.
- **Doesn't auto-sync federation rules.** Public federation docs change; a
  future Wave may add Avalara-style automated cutoff sync. Not in scope now.
- **Doesn't own consent flows.** Minor-safeguarding consent lives in the
  `consent` module + is triggered by `is_youth=true` downstream references.

## 8. Wave 3a scope boundaries

The tenancy module fires `TenantProvisioned` — this module's listener seeds the
default catalog for NEW tenants going forward. Existing tenants at deploy time
are handled by the one-shot `age-group:seed-defaults-for-tenant --all` variant.
Idempotent — safe to re-run.

Wave 3a does NOT enforce `AGE_GROUP_BOUNDS_INVALIDATE_ATHLETES` (that check is a
no-op because Athlete + AthleteEnrollment don't exist yet). Wave 3+ will hook
the Athlete module's roster into the AgeGroupObserver's bounds-mutation check,
so from Wave 3+ onward, bounds changes on an in-use group refuse with a 409
listing affected athletes.

## 9. Cross-references

- `.kiro/steering/hierarchy.md` §1a — canonical vocabulary (AgeGroup helps
  assess Athlete → Team fit)
- `.kiro/steering/hierarchy.md` §7 — tier matrix (age_group_slot +
  age_group_custom)
- `.kiro/steering/tenancy-columns.md` §3 — the tenant_id mandate (AgeGroup
  carries tenant_id, nullable organization_id)
- `.kiro/steering/tenancy-columns.md` §5 — forbidden columns (region_id on
  age_groups, branch_id on age_groups, application_id on age_groups)
- `modules/platform/blueprints/region/` — the sibling reference-data blueprint
  this module mirrors in shape
- `modules/platform/blueprints/tenancy/` — the parent Tenant module firing
  `TenantProvisioned`
- `modules/sports/README.md` — sports tier index
