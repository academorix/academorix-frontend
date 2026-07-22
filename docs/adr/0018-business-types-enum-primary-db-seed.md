# ADR 0018 — Business types: enum-primary in code, DB-seed for admin visibility

**Status:** Accepted **Date:** 2026-07-21 **Deciders:** Backend architecture

## Context

The platform ships a fixed taxonomy of business types the tenant admin picks
during onboarding (`SportsCenter`, `Club`, `Academy`, `School`, `MultiSport`,
`Gym`, `Studio`, `Other`, plus a code-level `Custom` bucket for tenant-defined
rows). Business type drives three concerns simultaneously:

1. **Code branches on the value.** The default persona catalogue, the default
   feature set, the default permission map, the initial tier assignment — every
   one of these does `match ($businessType) { ... }` at boot.
2. **Admin UI renders it.** Tenant admin picks their business type from a
   dropdown with a label + description + sort order — the UI needs a real
   row-backed catalogue.
3. **Tenants may create custom types.** A martial-arts academy or a coding
   bootcamp doesn't fit our shipped taxonomy — the tenant admin creates a custom
   `business_types` row scoped to their tenant.

Neither a pure enum nor a pure DB table handles all three:

- **Pure enum** — great for code branches, terrible for admin UI (no labels, no
  i18n, no sort order, no tenant-owned customs).
- **Pure DB table** — great for admin UI, terrible for code branches (every
  `match` becomes `if ($businessType->slug === 'sports_center')` string
  comparisons, no compile-time exhaustiveness, no IDE autocomplete).

## Options considered

1. **Pure enum, custom types not supported (reject).** Loses tenant flexibility.
   Martial arts academy has to pick "Other" — no admin customization.

2. **Pure DB table, no enum (reject).** Loses type safety on the code side.
   Every branch becomes a fragile string comparison; PHPStan can't verify
   exhaustiveness.

3. **Enum + DB table synced by hand (reject).** Drift-prone. Adding a new
   business type means updating two places; forgetting one leaves the app in a
   state where the enum knows about a case the DB doesn't (or vice versa).

4. **Enum primary + seeder-derived DB mirror (chosen).** Enum is authoritative
   for code branches. Seeder walks `BusinessTypeEnum::cases()` and upserts
   matching rows in the `business_types` table with `is_system: true`. Tenants
   create custom rows with `is_system: false`. Adding a new business type is a
   single code change; the seeder re-runs on deploy and reconciles the table.

## Decision

### D1 — Enum is authoritative for code branches

Every code-level branch on business type reads the ENUM:

```php
$type = BusinessTypeEnum::tryFrom($tenant->business_type_slug)
    ?? BusinessTypeEnum::Custom;

$defaultRoles = match ($type) {
    BusinessTypeEnum::SportsCenter,
    BusinessTypeEnum::Club,
    BusinessTypeEnum::Academy => ['coach', 'athlete', 'parent', 'medical'],

    BusinessTypeEnum::Other,
    BusinessTypeEnum::Custom => ['coach', 'athlete', 'parent'],
};
```

The `tryFrom($slug) ?? Custom` fallback is the canonical resolution pattern. Any
slug that doesn't match a system case is a tenant custom, which code treats as
`BusinessTypeEnum::Custom`.

### D2 — The `business_types` table mirrors the enum for admin visibility

The migration column set is fixed (per
`.kiro/steering/enum-db-seed-dual-source.md`):

| Column        | Type                        | Purpose                                  |
| ------------- | --------------------------- | ---------------------------------------- |
| `id`          | `string(30)` PK             | Prefixed ULID (`bt_...`)                 |
| `slug`        | `string(64)`                | Matches enum case value for system rows  |
| `label`       | JSON translatable           | Admin display copy                       |
| `description` | JSON translatable, nullable | Admin longer copy                        |
| `sort_order`  | `integer`                   | Admin drag-drop reorder                  |
| `is_system`   | `boolean`                   | `true` for enum-seeded, immutable rows   |
| `tenant_id`   | `string(30) nullable`       | `null` for system, set for tenant custom |

Unique constraint: `(tenant_id, slug)`.

### D3 — Seeder is idempotent, discovered via `#[AsSeeder]`

The `BusinessTypeSeeder` iterates `BusinessTypeEnum::cases()` (skipping
`Custom`, which is a code-level bucket only), and upserts each case as a system
row. Discovered by attribute (see ADR-0011 — `#[AsSeeder]` seeder discovery).
Runs on every `db:seed` — safe because it's `updateOrCreate` on a stable slug.

### D4 — System rows are immutable outside the seeder

- **Observer** — `BusinessTypeObserver` rejects `saving` / `deleting` on any row
  where `is_system = true`, unless the mutation is inside the
  `BusinessType::allowSystemMutation(fn () => ...)` scope. Only the seeder +
  tests that fixture system state open that scope.
- **Policy** — `BusinessTypePolicy::update` / `::delete` return `false` on
  system rows regardless of the actor's permissions. Observer guards ORM writes;
  policy guards HTTP writes. Both are required — neither alone is sufficient.

### D5 — `Custom` case is code-only, never persisted

The `BusinessTypeEnum::Custom` case is a catch-all bucket for tenant- created
rows. The seeder MUST skip it. Persisting `Custom` as a system row would collide
with the tenant-custom bucket semantics.

Note: `Custom` (code bucket) and `Other` (system row for
"known-business-outside-taxonomy") are semantically distinct. `Other` IS
persisted as `is_system: true`; `Custom` is not.

## Consequences

**Positive:**

- **Code branches are type-safe.** `match` on the enum is exhaustive; PHPStan
  verifies at CI time.
- **Admin UI works.** The `business_types` table gives the admin screen a real
  catalogue with labels + i18n + sort order.
- **Tenants can add customs.** `is_system: false` rows scoped to a tenant expose
  the extension point.
- **Adding a case is one code change.** Add to the enum, redeploy; the seeder
  walks the new case and upserts the DB row. No manual DB edit.

**Negative:**

- **Four required components per catalogue** (Enum + Model + Seeder +
  Observer/Policy). Ceremony compared to the pure-DB shape. Justified because
  the pattern applies to only ~6-8 catalogues workspace-wide.
- **Two words for the "not one of ours" concept.** `Other` (system row) and
  `Custom` (code bucket) — every builder learns the distinction once.

**Neutral:**

- The pattern generalizes. Every dual-source catalogue in the workspace (leave
  reasons, notification channels, attendance statuses, payment methods) can
  adopt this shape when it earns the three decision-test criteria in
  `.kiro/steering/enum-db-seed-dual-source.md`.

## Related work

- `.kiro/steering/enum-db-seed-dual-source.md` — the day-to-day authoring rules
  this ADR codifies (four required components, observer + policy pair, `Custom`
  skip in seeder, immutability scope helper).
- ADR-0011 — Seeder discovery via `#[AsSeeder]` (the attribute the seeder in
  this ADR carries).
- `.kiro/steering/hierarchy.md` §2 — the tenancy tree where
  `Tenant.business_type_slug` lives.
- `.kiro/steering/tenancy-columns.md` — the row-attribution rules that scope the
  `business_types.tenant_id` column.
