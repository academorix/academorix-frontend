# sports-registry — changelog

## [Unreleased] — inception (Wave 3a of the sports tier)

- Registry module authored. Three entities: `Sport` (`spo_`), `Discipline`
  (`dis_`), `Position` (`pos_`) — the canonical sport taxonomy every Wave 3
  sports module references via `sport_key` / `discipline_key` / `position_key`
  string columns.
- Row-level attribution — every entity carries `tenant_id` NULLABLE. NULL =
  platform-scoped (visible to every tenant); non-null = tenant custom
  (Enterprise-only). NEVER `application_id` (the catalog crosses applications),
  NEVER `region_id` / `branch_id` / `organization_id` / `scope_node_id` /
  `parent_id` (per `.kiro/steering/tenancy-columns.md` §5).
- **38-sport platform catalog** shipped at `data/platform-sports-catalog.json`
  (38 sports · 93 disciplines · 92 positions = 223 rows). Covers 10 categories:
  - Team sports (12): football, basketball, rugby, american_football, cricket,
    baseball, hockey, ice_hockey, volleyball, handball, netball, lacrosse.
  - Aquatic (2): swimming, water_polo.
  - Racquet (4): tennis, badminton, squash, table_tennis.
  - Combat (4): martial_arts, boxing, wrestling, fencing.
  - Individual (2): gymnastics, triathlon.
  - Track & field (1): athletics.
  - Cycling (1): cycling.
  - Winter (3): skiing, snowboarding, figure_skating.
  - Fitness (6): yoga, pilates, general_fitness, crossfit, dance, aerobics.
  - Recreational (3): chess, esports, general_recreation.
  - Each Sport ships name, slug, category, gender_typical, age_range,
    governing_body, primary_color, icon (Iconify identifier), plus its
    Disciplines (with format_type + player_count + session_duration) and
    per-Discipline Positions (with is_field_position + is_offensive /
    is_defensive + typical jersey ranges).
- Platform-seeded catalog loads at platform first-boot via
  `SeedPlatformSportsCatalogJob` triggered by `foundation::ApplicationBooted`.
  Idempotent — running a second time no-ops when the catalog is already present.
  Explicit reseed via `sports:registry:reseed-platform-catalog --force` picks up
  JSON edits.
- Tenant custom entries (Enterprise-only via the `sports_registry_custom`
  entitlement) let tenants add sports / disciplines / positions beyond the
  platform catalog. Consumed by `sports_registry_custom_slot`.
- `SportKeyResolver` service maps strings to rows at read time (tenant custom +
  platform-seeded + historical layers). Cached at
  `sports:resolve:{tenant_id}:{sport_key}[:{discipline_key}[:{position_key}]]`
  for 1 hour.
- `ReconcileSportReferencesJob` — nightly at 04:15 UTC. Scans every table listed
  in `config('sports_registry.reconciler.reference_tables')` for unresolved
  `sport_key` / `discipline_key` / `position_key` references. Wave 3a:
  `['teams']`; Wave 3+ appends athlete_enrollments, coaches, events, sessions,
  seasons, age_groups, facilities.
- `SportPrefixResolutionFailed` event fires per unresolved reference —
  audit-critical (7-year retention floor for compliance replay).
- Slug + parent references (sport_id, discipline_id) + tenant_id +
  is_platform_seeded are IMMUTABLE post-create.
- Platform-seeded rows are PERMANENT — never hard-deleted (only deactivated).
  Tenant customs follow the 730-day deactivation retention window before
  `PurgeArchivedRegistryRowsJob` is eligible to hard-delete.
- Tenant customs cannot shadow platform slugs
  (`SPORT_KEY_COLLIDES_WITH_PLATFORM` 422).
- Cross-tenant references refused (`CROSS_TENANT_REGISTRY_REFERENCE` 422) — a
  tenant custom Discipline may hang off a platform Sport or the caller's own
  custom Sport, but never off another tenant's custom Sport.
- Tenant-facing surface: full CRUD on `/api/v1/sports`, `/api/v1/disciplines`,
  `/api/v1/positions`, plus a hypothetical `/api/v1/sports/resolve` endpoint for
  downstream write-path validation.
- Platform-admin surface: cross-tenant read + platform-level catalog CRUD + a
  `/api/v1/platform/sports/reseed` support-tooling endpoint.
- 15 lifecycle events published: SportCreated, SportUpdated, SportDeactivated,
  DisciplineCreated, DisciplineUpdated, DisciplineDeactivated, PositionCreated,
  PositionUpdated, PositionDeactivated, TenantCustomSportCreated,
  TenantCustomDisciplineCreated, TenantCustomPositionCreated,
  SportCatalogSeeded, SportCatalogUpdated, SportPrefixResolutionFailed.
- Notifications: TenantCustomSportCreatedNotification (opt-in),
  SportPrefixResolutionFailedNotification (cannot opt out — dangling reference
  impact), SportCatalogUpdatedNotification (opt-in, default off).
- Entitlements published: `sports_registry_read` (implicit boolean),
  `sports_registry_custom` (Enterprise-only), `sports_registry_custom_slot`
  (per-entity-type slot).
- Feature keys published: `sports_registry.core`,
  `sports_registry.custom_entries`, `sports_registry.resolver_api`,
  `sports_registry.discipline_picker`, `sports_registry.position_picker`
  (Medium+), `sports_registry.governing_body_display` (Enterprise),
  `sports_registry.i18n_names`.
- 11 health probes covering table migration, catalog JSON parseable, platform
  catalog seeded, tenant FK integrity, slug uniqueness, parent FK integrity,
  cross-tenant reference integrity (SECURITY), resolver reachable, reconciler
  recent, drift-count bounded, purge queue drained.
- 3 background jobs: SeedPlatformSportsCatalogJob (first-boot seeder),
  ReconcileSportReferencesJob (nightly drift scan), PurgeArchivedRegistryRowsJob
  (weekly hard-delete of aged tenant customs with zero references).
- 3 observers: SportObserver, DisciplineObserver, PositionObserver.
- 2 owned traits: ReferencesSport (mixed into downstream Wave 3 models that
  carry sport_key), HasSportRegistryCatalog (on Tenant, exposes merged-catalog
  accessors).
- 1 tenancy hook: PreventCustomRegistryOrphansOnTenantErased. NO per-tenant seed
  hook — the platform catalog is global.
- Sport / Discipline / Position use `HasTranslations` for name + description
  localization (Arabic + French + Spanish + …).
- 8 validation rules: valid_sport_key, valid_discipline_key, valid_position_key,
  valid_hex_color, valid_iconify_identifier, sport_key_registered,
  discipline_belongs_to_sport, position_belongs_to_discipline.
- 10 Artisan commands including seed-platform-catalog, reconcile-references,
  create-custom-sport/discipline/position, deactivate.
- Analytics: 10 Segment `track` events. sport_id / discipline_id / position_id
  are ULIDs — anonymised identifiers, no PII risk.
- Metrics: 17 OpenTelemetry metrics covering created / updated / deactivated
  counters + point-in-time active/per-tenant gauges + resolver latency
  histograms + reconciler drift counters + purge queue gauges + downgrade-drift
  gauge + cross-tenant orphan-check counter.
- SDUI surfaces: 3 resources (Sport / Discipline / Position with list + create +
  edit screens for Sport) + 4 widgets (sport-picker, discipline-picker,
  position-picker, sport-chip). All pickers use HeroUI `ComboBox` per the
  ui-components rule.
- ULID prefixes reserved: `spo_` (Sport — promoted from reserved to active),
  `dis_` (Discipline — new), `pos_` (Position — new).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `entitlements`.
- Extended by: NONE. `extendedBy: []` — downstream Wave 3 modules reference the
  catalog via `sport_key` / `discipline_key` / `position_key` STRING columns,
  not FKs. Every consumer stays loosely coupled via slug lookup through
  `SportKeyResolver`.
- Planned consumers: `team`, `athlete`, `athlete-enrollment`, `coach`, `event`,
  `session`, `age-group` (already ships), `finance`, `notifications`.

### Non-goals for this release

Every non-goal below stays out of this module. See `readme.md` §7 for the full
list.

- No cross-tenant sport / discipline / position rows.
- No `application_id` on registry rows — the catalog is cross-application.
- No `region_id` / `branch_id` / `organization_id` on registry rows.
- No FK from downstream Wave 3 rows to registry — every consumer uses string
  keys via the resolver.
- No slug renames — slugs are IMMUTABLE post-create because downstream rows
  carry them as strings.
- No hard-delete of platform-seeded rows — permanent.
- No auto-shadowing of platform slugs by tenant customs.
- No AI-driven catalog suggestions.
- No federation-API sync (FIFA / FIBA / FINA) — deferred to a post-Wave-3
  concern.
- No age-group cutoff config here — that lives on AgeGroup rows scoped by
  sport_key.
- No facility-compatibility rules here — that lives on Facility rows via
  `compatible_sport_keys` array.
- No per-sport equipment inventory — a future `equipment` module (post Wave 3)
  will own that.
