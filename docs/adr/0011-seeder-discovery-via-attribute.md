# ADR 0011 — Seeder discovery via `#[AsSeeder]`

**Status:** Accepted **Date:** 2026-07-21 **Deciders:** Backend architecture

## Context

Laravel's out-of-the-box seeder pattern requires a `DatabaseSeeder` class that
hardcodes every seeder to run:

```php
public function run(): void
{
    $this->call([
        BusinessTypeSeeder::class,
        RegionSeeder::class,
        RoleSeeder::class,
        // ... 47 more lines
    ]);
}
```

That shape works for a monolith. It falls apart in a package monorepo:

- **Every new package adds a manual entry** to `DatabaseSeeder`. Forget the
  entry, the seeder never fires; the developer discovers this at onboarding when
  the DB doesn't have the row they expected.
- **Ordering becomes implicit.** `BusinessTypeSeeder` must run before
  `TenantSeeder` (tenants reference business types). Nothing in code enforces
  that; the order in the array is the enforcement, and reviewers routinely
  reorder it "for readability".
- **Environment gating is by hand.** Some seeders are dev-only, some are
  every-environment, some are per-tenant-only. The `DatabaseSeeder` becomes a
  growing `if (App::environment('local'))` tree.
- **Cross-package dependencies invert control.** Package A's `DatabaseSeeder`
  reaches into package B's seeder class — a physical dependency in a Composer
  path repo that ought to be a soft one.

The pattern that dissolves this — used across the framework for other
discoveries (cache-tag resolvers, blueprints, personas, tools) — is
**attribute-driven discovery**: every seeder carries `#[AsSeeder]`, the
framework discovers them at boot, sorts by priority, and runs them. Adding a
seeder is one file change.

## Options considered

1. **Keep manual `DatabaseSeeder::call([...])` list (reject).** Every failure
   mode above stays.

2. **Convention over configuration — every seeder in `database/seeders/` runs
   (reject).** Loses the ability to gate seeders by environment or tenant. Loses
   explicit priority; runs in filesystem order, which drifts.

3. **`#[AsSeeder(priority, environments)]` on each seeder + discovery at boot
   (chosen).** Every seeder self-declares its priority and its environments.
   Discovery walks `#[AsSeeder]` targets, filters by environment, sorts by
   priority, runs. `DatabaseSeeder` becomes a one-liner that delegates to the
   discovery.

## Decision

### D1 — Every seeder carries `#[AsSeeder]`

```php
#[AsSeeder(priority: 20, environments: [])]
final class BusinessTypeSeeder extends Seeder
{
    public function run(): void
    {
        // ...
    }
}
```

Attribute shape:

```php
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsSeeder
{
    public function __construct(
        public int  $priority = 100,
        public array $environments = [],   // [] means every environment
        public bool $enabled = true,
    ) {}
}
```

### D2 — Priority ranges are pinned

| Range          | Purpose                     | Example                           |
| -------------- | --------------------------- | --------------------------------- |
| **0 .. 9**     | Framework primitives        | Reference data with no FK deps    |
| **10 .. 29**   | Tenancy + system catalogues | `BusinessTypeSeeder` (20)         |
| **30 .. 59**   | Cross-cutting reference     | `RegionSeeder`, `CountrySeeder`   |
| **60 .. 99**   | Auth + access baseline      | `RoleSeeder`, `PermissionSeeder`  |
| **100 .. 199** | Domain seed data            | Per-module seeders                |
| **200+**       | Test / dev fixtures         | Only run when environment matches |

Lower priority runs first. Ties break by FQCN so the seed order is deterministic
across boots.

### D3 — Discovery lives in `DatabaseSeeder`

The `DatabaseSeeder` is one function. It resolves the `DiscoversAttributes`
seam, walks `#[AsSeeder]` targets, filters, sorts, and calls each:

```php
public function run(DiscoversAttributes $discovery): void
{
    $env = $this->getContainer()->environment();
    $seeders = [];

    foreach ($discovery->forClass(AsSeeder::class) as $target) {
        if ($target->attribute->enabled === false) {
            continue;
        }
        if ($target->attribute->environments !== []
            && ! in_array($env, $target->attribute->environments, true)) {
            continue;
        }

        $seeders[] = [
            'priority' => $target->attribute->priority,
            'fqcn'     => $target->className,
        ];
    }

    usort($seeders, fn ($a, $b) => [$a['priority'], $a['fqcn']]
                                <=> [$b['priority'], $b['fqcn']]);

    foreach ($seeders as $row) {
        $this->call($row['fqcn']);
    }
}
```

### D4 — Environments field is authoritative

- `environments: []` — runs in every environment (default).
- `environments: ['local', 'testing']` — runs only in the listed environments.
  Prod seeders MUST use `[]` unless they're genuinely dev-only.
- Test seeders live in `database/seeders/` alongside prod ones — discovery
  discriminates by attribute, not by folder.

## Consequences

**Positive:**

- **Adding a seeder is one file.** No `DatabaseSeeder` edit.
- **Environment gating is declarative.** No `if (App::environment(...))` trees.
- **Priority is explicit.** Every seeder self-declares its ordering intent.
- **Cross-package seed order is deterministic.** Priority + FQCN tie-break means
  every worker seeds in the same order.

**Negative:**

- **Reading the seed order requires walking every `#[AsSeeder]` attribute**
  rather than one file. Mitigated by a `php artisan seed:list` command that
  prints the resolved order.
- **The `DiscoversAttributes` seam must be bound before seeding.** Test seeders
  that bind an `InMemoryDiscoversAttributes` fake need to register their
  fixtures explicitly.

**Neutral:**

- Every dual-source catalogue seeder (per ADR-0018) uses this attribute. That's
  the primary consumer.

## Related work

- `.kiro/steering/enum-db-seed-dual-source.md` — the ADR-0018 dual-source
  pattern that consumes `#[AsSeeder]` on every catalogue seeder.
- `.kiro/steering/discovery.md` — the shared `DiscoversAttributes` seam every
  discovery flows through.
- `.kiro/steering/discovery-vs-loader.md` — the two-layer pattern (framework
  primitive vs domain adapter) this ADR fits.
- ADR-0018 — Business types enum-primary + DB seed (the canonical dual-source
  seeder).
