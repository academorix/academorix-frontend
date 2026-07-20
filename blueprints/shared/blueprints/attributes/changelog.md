# attributes — changelog

## [Unreleased] — inception (Wave 0)

- Attributes module authored. Three owned entities:
  - `AttributeDefinition` (`ads_`) — typed field with widget hints +
    validation + bilingual labels.
  - `AttributeSet` (`asg_`) — versioned collection of definitions bound to
    (entity_type, discriminator_value).
  - `AttributeGroup` (`atg_`) — visual grouping within a set (Primary Stats /
    Position / …).
- Values NOT a row-per-value table — persisted as `JSONB` on host entities via
  `spatie/laravel-schemaless-attributes`. Hosts include
  `athlete_enrollments.attributes`, `progress_assessments.values`,
  `performance_test_results.metrics`.
- Attribute-driven discovery via `#[AttributableEntity]` — host models opt in
  with a class-level attribute; `AttributableEntityRegistry` compiles the
  entity_type → discriminator column map at boot.
- Load-bearing invariants:
  - Exactly one active AttributeSet per
    `(tenant_id, entity_type, discriminator_value)` via partial unique index.
  - Version monotonicity per `(entity_type, discriminator_value)` — breaking
    change bumps version, old versions preserved for historic render.
  - AttributeDefinition delete refused when referenced by any set.
- 11 published events including `AttributeSetVersioned` (cache invalidation),
  `AttributeSetActivated` (collision refused), `AttributeValuesRejected`
  (validator negative signal).
- Downstream planned consumers: athlete-enrollment, progress, performance,
  development, safeguarding, drills, medical, sports/registry.
- Retention: definitions + sets + groups retained while active + 7y
  post-archive; historic sets NEVER purged while any host record references them
  via captured version_snapshot.

### Compatibility

- Depends on `foundation`, `tenancy`, `application`.
- Extended by NONE. Planned consumers listed above.

### Design notes

- No `application_id` / `region_id` / `organization_id` / `scope_node_id` on any
  attributes table. Application cascades through tenant.
- The reference domain used `commerce-attributes` (row-per-value EAV) — we
  deliberately reject that to avoid join explosion. Values live in JSONB via
  `spatie/laravel-schemaless-attributes`.
- Filterable attributes are projected into generated columns / search index at
  the host module — not stored redundantly here.
- Lunar's attribute system studied as a design reference — NOT adopted wholesale
  (too heavy for our use).

### ULID prefix registration

- `ads_` (AttributeDefinition), `asg_` (AttributeSet), `atg_` (AttributeGroup) —
  new. Register in
  `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.
