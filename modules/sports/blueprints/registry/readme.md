# registry

The sport CATALOG. Owns `Sport` + `Discipline` + `Position` — the canonical
taxonomy that hardens every `sport_key` + position identifier used across Wave 3
sports modules. Wave 3a of the sports tier (priority 60).

## 1. What this module owns

| Concern                         | Owned artefact                                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Top-level sport                 | `Sport` (`sports.tenant_id` NULL for platform, non-null for tenant customs) — slug + category + governing body        |
| Sport sub-variant / competition | `Discipline` (`disciplines.sport_id`) — one Sport hasMany Disciplines (e.g. football → football_11v11, football_5v5)  |
| Sport-specific role / position  | `Position` (`positions.discipline_id`) — one Discipline hasMany Positions (e.g. football_11v11 → goalkeeper, forward) |
| Platform-seeded catalog         | `data/platform-sports-catalog.json` — 38 sports across 10 categories, 93 disciplines, 92 positions (223 rows total)   |
| First-boot seeder               | `SeedPlatformSportsCatalogJob` — idempotent; runs on platform boot when the sports table is empty                     |
| Reference reconciler            | `ReconcileSportReferencesJob` — nightly; detects Wave 3 rows referencing sport_keys that don't resolve                |
| Slug resolver                   | `SportKeyResolver` — resolves `football` OR `football.football_11v11` OR `football.football_11v11.goalkeeper` triples |
| Tenant custom factory           | `CustomEntryFactory` — validates + creates tenant customs against the `sports_registry_custom` entitlement            |
| Tenant surface                  | Merged catalog read for every tenant; write on customs only (Enterprise)                                              |
| Platform-admin surface          | Cross-tenant catalog administration + support-tooling re-seed                                                         |
| Entitlement gates               | `sports_registry_read` (implicit — every tier), `sports_registry_custom` (Enterprise), `sports_registry_custom_slot`  |

### 1.1 Registry lands FIRST — every other sports module composes it

Registry is priority 60 — it boots after tenancy (10), application (20), and
entitlements (40), but BEFORE every other sports module. AgeGroup (53), Season
(52), Team (Wave 2b), Athlete (Wave 3), AthleteEnrollment (Wave 3), Coach (Wave
3), Event (Wave 3), Session (Wave 3) — every one of them references `sport_key`
on write, and every one has this module as its implicit dependency for the
resolver.

The catalog is a strict prerequisite: a tenant without a seeded catalog cannot
create a Team, enroll an Athlete, or schedule a Session, because those rows
demand a resolvable sport_key. The `SeedPlatformSportsCatalogJob` runs once at
platform boot (idempotent) so the catalog is guaranteed present before any
tenant lands.

### 1.2 Downstream modules reference by string, not FK

`extendedBy: []` is deliberate. Downstream sports modules carry `sport_key` as a
plain string column (`sports_registry.sport_key = 'football'`), NOT a foreign
key to `sports.id`. Two reasons:

1. **Loose coupling.** A Team can carry `sport_key = 'football'` without a
   compile-time reference to the Sport model. The registry can evolve (add
   sports, deprecate old ones, split a sport into two rows) without cascading
   schema changes across seven downstream modules.
2. **Cross-tenant resolution.** Platform sports (tenant_id NULL) apply to every
   tenant. Tenant customs (tenant_id NOT NULL) apply only to their tenant. A FK
   column can't express "resolve to the platform row when the tenant has no
   custom" — but a string lookup with `SportKeyResolver` can.

The tradeoff is `ReconcileSportReferencesJob` — a nightly sweep that catches
downstream rows carrying `sport_key` values that fail to resolve. Wave 3
downstream modules append their table to
`sports_registry.reconciler.reference_tables` config so the reconciler picks
them up automatically.

### 1.3 The three levels of the taxonomy

The catalog is a strict three-level tree:

```
Sport (spo_ ULID, tenant_id NULL for platform, slug e.g. 'football')
    ↓ hasMany
Discipline (dis_ ULID, sport_id FK, slug e.g. 'football_11v11')
    ↓ hasMany
Position (pos_ ULID, discipline_id FK, slug e.g. 'football_goalkeeper')
```

Every level is optionally addressable:

- `Team.sport_key = 'football'` — Sport level (the Team is football; specific
  competition format is decided later per event or per season).
- `Team.sport_key = 'football'` + `Team.discipline_key = 'football_11v11'` —
  Sport + Discipline level (the Team plays 11v11 football specifically).
- `AthleteEnrollment.sport_key = 'football'` +
  `AthleteEnrollment.discipline_key = 'football_11v11'` +
  `AthleteEnrollment.position_key = 'football_goalkeeper'` — full triple (the
  athlete is enrolled specifically as a goalkeeper in 11v11 football).

Every level is independently deactivatable via `is_active=false` — a Sport row
is retained forever (deactivating never deletes) but hidden from the tenant
picker. Deactivated rows are still returned by `SportKeyResolver::resolve(...)`
for historical resolution (an Athlete enrolled last season as
`football_goalkeeper` should still resolve when their enrollment is viewed).

### 1.4 Platform-seeded vs tenant customs

Two flavours of every row:

- **Platform-seeded** (`is_platform_seeded=true`, `tenant_id=NULL`) — the 30+
  sports shipped in `data/platform-sports-catalog.json`. Every tenant reads
  them. Only platform admins can add / edit / deactivate. Tenants cannot modify
  OR reference them by FK (they reference by string slug).
- **Tenant custom** (`is_platform_seeded=false`, `tenant_id=<tenant>`) —
  Enterprise-only via the `sports_registry_custom` entitlement. Tenants add
  their own sports / disciplines / positions when their programme includes a
  sport not in the platform catalog (e.g. a specific martial-art variant, a
  region-specific game).

A tenant's effective catalog is the UNION of platform-seeded rows + their own
customs — the merge happens at read time via `Sport::forTenant($tenant)`. Tenant
customs cannot shadow platform slugs; a `sport_key='football'` custom by Tenant
X collides with the platform row and is refused at write time with
`SPORT_KEY_COLLIDES_WITH_PLATFORM`.

### 1.5 The 30+ sport platform catalog

The seed file `data/platform-sports-catalog.json` covers the platform's baseline
sport taxonomy. See §4 for the full list; highlights:

- **Team sports** (13) — football (soccer) with 11v11 + futsal + 5v5; basketball
  with 5v5 + 3x3; rugby, american_football, cricket, baseball, hockey,
  ice_hockey, volleyball, handball, netball, water_polo, lacrosse.
- **Individual sports** (10) — swimming (freestyle + backstroke + breaststroke
  - butterfly + relay + individual_medley), tennis, badminton, squash,
    table_tennis, gymnastics, athletics, cycling, triathlon.
- **Combat sports** (4) — martial_arts (karate + taekwondo + judo + bjj),
  boxing, wrestling, fencing.
- **Fitness disciplines** (6) — yoga, pilates, general_fitness, crossfit, dance,
  aerobics.
- **Winter sports** (3) — skiing, snowboarding, figure_skating.
- **Recreational** (2+) — chess, esports, general_recreation.

Each Sport entry carries name, slug, category, gender_typical (male_only /
female_only / mixed / any), age_range, governing_body (FIFA / FIBA / FINA /
World Rugby / …), plus its disciplines with player_count_min/max and typical
session durations, plus per-discipline positions with is_field_position and
is_offensive/is_defensive hints.

## 2. The row-level attribution contract

All three entities carry `tenant_id` NULLABLE + a NULL semantic. Per
`.kiro/steering/tenancy-columns.md` §3 + §5:

- ✅ `sports.tenant_id` — nullable, FK to `tenants.id`, `onDelete=cascade`. NULL
  = platform-scoped catalog entry (every tenant reads it). Non-null = tenant
  custom (only that tenant reads it).
- ✅ `disciplines.tenant_id` — same shape (NULL = platform, non-null = custom).
  Plus `disciplines.sport_id` FK — a custom Discipline may hang off a platform
  Sport (an Enterprise tenant adds their own `football_walking` discipline under
  the platform `football` sport).
- ✅ `positions.tenant_id` — same shape. Plus `positions.discipline_id` FK —
  same cross-scope rule (custom Position may hang off platform Discipline).
- ❌ `sports.application_id` — FORBIDDEN. The catalog crosses applications;
  every product deployment reads the same taxonomy. If application-specific
  sports become a real requirement, we'd add an application_id column to Sport
  in a future major (unlikely — the taxonomy is deliberately cross-application).
- ❌ `sports.region_id` — FORBIDDEN. Football is football everywhere. Regional
  governing-body variants (US Soccer vs UEFA cutoff rules) are age-group cutoff
  concerns, not sport-catalog concerns — they live on AgeGroup rows scoped by
  sport_key, not on separate Sport rows.
- ❌ `sports.organization_id` — FORBIDDEN. Same reasoning — organizations are
  brand-scoped structural containers, not sport-catalog owners.
- ❌ `sports.branch_id` — FORBIDDEN.
- ❌ `sports.scope_node_id` — FORBIDDEN. Registry is a scope-node entity (scope
  nodes reference sports via `entity_id`), not a scope consumer.
- ❌ `sports.parent_id` — FORBIDDEN. The tree is Sport → Discipline → Position
  via typed FK columns, not a self-referential recursion.

Cross-tenant FKs are forbidden. A tenant custom Discipline pointing at another
tenant's custom Sport is refused with `CROSS_TENANT_REGISTRY_REFERENCE` (422).

## 3. Tier boundaries

Per `hierarchy.md` §7 tier matrix + this module's entitlements:

| Tier       | Read platform catalog | Create tenant customs | Custom slot cap |
| ---------- | --------------------- | --------------------- | --------------- |
| Small      | ✅ (implicit)         | ❌ (locked)           | 0               |
| Medium     | ✅ (implicit)         | ❌ (locked)           | 0               |
| Enterprise | ✅ (implicit)         | ✅ via `_custom`      | unlimited (∞)   |

Backed by two entitlements + one implicit:

- **`sports_registry_read`** (implicit boolean, every tier) — every tenant reads
  the merged catalog. Not surfaced in the entitlements API because it's always
  on; codified here for auditor completeness.
- **`sports_registry_custom`** (boolean, Enterprise-only) — enables creating
  tenant custom sports/disciplines/positions. Off (Small + Medium) = POST
  returns `SPORTS_REGISTRY_CUSTOM_DISABLED` (402).
- **`sports_registry_custom_slot`** (slot, per entity type) — quantity cap per
  (tenant, entity_type) tuple. Enterprise default: unlimited (null). Consumed on
  `is_platform_seeded=false` create. Refuses further customs with
  `SPORTS_REGISTRY_CUSTOM_QUOTA_EXCEEDED` (402) once exhausted.

Downgrading Enterprise → Medium does NOT auto-deactivate existing customs (the
entitlement reconciler surfaces the drift + suggests a manual archive path),
because downstream Wave 3 rows may still reference the custom sport_keys.

## 4. The platform-seeded catalog

`data/platform-sports-catalog.json` ships the platform's baseline sport
taxonomy. Version 1 covers 30+ sports across 10 categories. Each entry declares:

- **Sport** — name, slug (kebab-case, e.g. `football`), category, governing
  body, gender_typical, age_range, primary_color (hex), iconify icon identifier,
  sort_order.
- **Disciplines[]** — nested under each Sport. name, slug (kebab-case, e.g.
  `football_11v11`), format_type (team / individual / relay / pairs / squads),
  player_count_min/max, session_duration_default_minutes.
- **Positions[]** — nested under each Discipline. name, slug (kebab-case, e.g.
  `football_goalkeeper`), is_field_position, is_offensive/is_defensive, typical
  jersey range.

Bilingual names (English + Arabic-ready) are supported via the localization
module's `HasTranslations` trait on the model (the seed file ships English only;
the localization module + `sports:registry:seed-platform-catalog` integrate to
populate Arabic).

## 5. Lifecycle timeline

Every entity follows the same simple lifecycle:

```
[created]  is_platform_seeded=true (via SportCatalogSeeder)
           OR
           is_platform_seeded=false (via CustomEntryFactory, Enterprise only)
    ↓
[edited]   name / description / color / icon / sort_order — any admin
           slug / category / governing_body / gender_typical / age_range
           — platform admins only on platform rows; tenant admins on customs
    ↓ (deactivate — is_active=false; NEVER hard-delete)
[deactivated]  is_active=false; hidden from tenant picker; still resolves via
               SportKeyResolver for historical enrollment references
    ↓ (reactivate — is_active=true)
[active]
    ↓ (purge — only on tenant customs, only when zero downstream refs remain)
[archived]  soft-deleted (deleted_at set); tenant custom only
    ↓ (restore within 1095-day window)
[active]
    ↓ (retention expires)
[hard-deleted]  fires <Entity>Deleted { mode: 'hard' }
                audit row survives 7 years
```

Guardrails:

- **Platform-seeded rows CANNOT be deleted.** Even by platform admins.
  `is_platform_seeded=true` rows are permanent — they can only be deactivated
  (`is_active=false`) which hides them from pickers but keeps the resolver +
  audit trail intact.
- **Rows in use CANNOT be archived.** Any downstream `sport_key` /
  `discipline_key` / `position_key` still referencing this row's slug blocks the
  write with `SPORT_REFERENCE_IN_USE` (409). The reconciler's reference table
  (`sports_registry.reconciler.reference_tables`) is the source-of-truth for
  what counts as "in use".
- **Slug is IMMUTABLE post-create.** Downstream rows carry the slug as a string;
  renaming the slug would silently orphan every reference. If a slug must
  change, deactivate the old row + create a new one, then run a migration to
  update every downstream `sport_key`.
- **A tenant custom cannot shadow a platform slug.**
  `SPORT_KEY_COLLIDES_WITH_PLATFORM` (422) — the tenant must pick a different
  slug (e.g. add a tenant prefix).

## 6. The resolver contract

`SportKeyResolver::resolve(sport_key, ?discipline_key, ?position_key, ?tenant)`
answers "does this triple exist in the catalog?". Three modes:

1. **Sport-only** — `resolve('football', null, null, $tenant)` returns the Sport
   row (platform or tenant custom).
2. **Sport + Discipline** —
   `resolve('football', 'football_11v11', null, $tenant)` returns the Sport +
   Discipline tuple.
3. **Full triple** —
   `resolve('football', 'football_11v11', 'football_goalkeeper', $tenant)`
   returns the Sport + Discipline + Position tuple.

Resolution order per tenant:

1. Tenant custom (tenant_id = current, is_active=true).
2. Platform-seeded (tenant_id NULL, is_active=true).
3. Tenant custom (tenant_id = current, is_active=false) — historical.
4. Platform-seeded (tenant_id NULL, is_active=false) — historical.

Fails (`SPORT_KEY_UNRESOLVED`) when no match. The failure fires
`SportPrefixResolutionFailed` for audit + surfaces via the reconciler report.

## 7. What this module does NOT do

- **Doesn't own teams / athletes / enrollments.** Wave 2b teams module owns
  Team; Wave 3 athlete + athlete-enrollment modules own those aggregates. This
  module only supplies the sport_key vocabulary.
- **Doesn't own age-group cutoffs.** AgeGroup ships the per-sport federation
  cutoff samples (`data/sport-cutoff-samples.json`); this module doesn't carry
  cutoff config. A sport's federation is a plain string on Sport; the cutoff
  rule is on AgeGroup.
- **Doesn't own facility booking rules per sport.** Facility module (Wave 2b)
  owns booking; a Facility may declare compatible sport_keys but the rules
  (booking duration, resource type, hourly rate) live on Facility.
- **Doesn't own equipment inventory.** A future `equipment` module (post-Wave 3)
  owns per-sport equipment; that module references sport_key via string the same
  way every other consumer does.
- **Doesn't shadow-clone sports across regions.** Football is football
  everywhere; regional federation variants are AgeGroup cutoff differences, not
  separate Sport rows.
- **Doesn't refuse deprecated sport_keys on write.** Deactivated
  (is_active=false) rows still resolve — downstream historical enrollments must
  survive. Only the tenant picker filters them out.
- **Doesn't auto-migrate downstream on slug rename.** Slugs are IMMUTABLE
  post-create because downstream rows carry them as strings.
- **Doesn't act as a permissions hierarchy.** Sport → Discipline → Position is a
  category tree, not a role hierarchy. Positions are competitive-role labels,
  not authorization roles (there is a special `coach` position slug but that's
  editorial — RBAC lives in the access module).

## 8. Wave 3a scope boundaries

The `SeedPlatformSportsCatalogJob` runs at platform boot (fires on the
`foundation::ApplicationBooted` event) and is idempotent — it only inserts rows
when the sports table is empty, or on explicit
`sports:registry:reseed-platform-catalog --force`. Existing tenants at deploy
time see the merged catalog immediately after seed completes.

Every Wave 3 module that adds `sport_key` (or `discipline_key`, `position_key`)
to a domain row lists its table in `sports_registry.reconciler.reference_tables`
so `ReconcileSportReferencesJob` picks it up automatically. Wave 3a: the config
lists `teams` (Wave 2b) as the only reference table; other tables are
placeholders that light up in later waves.

## 9. Cross-references

- `.kiro/steering/hierarchy.md` §1a — canonical vocabulary (Sport is the
  top-level taxonomy noun).
- `.kiro/steering/hierarchy.md` §7 — tier matrix (custom slot per tier).
- `.kiro/steering/tenancy-columns.md` §3 — the tenant_id mandate (all three
  entities carry nullable tenant_id — NULL = platform).
- `.kiro/steering/tenancy-columns.md` §5 — forbidden columns (application_id /
  region_id / branch_id / organization_id / scope_node_id / parent_id all
  forbidden on sports/disciplines/positions).
- `modules/sports/blueprints/age-group/` — the sibling module that ships
  `data/sport-cutoff-samples.json` referencing sport_keys from this catalog.
- `modules/sports/blueprints/season/` — the sibling temporal-container module
  that carries `sport_key` (Enterprise via `season_sport_scoping`).
- `modules/shared/blueprints/localization/` — the multilingual substrate that
  translates sport names on the tenant plane.
- `modules/platform/blueprints/tenancy/` — parent Tenant module.
- `modules/sports/README.md` — sports tier index.
