# ADR 0035 — Migration dependency ordering (transitive resolution of the boot graph)

**Status:** Accepted **Date:** 2026-07-22 **Deciders:** Data lead + Backend
architecture

## Context

Every Stackra service boots ~40-80 backend packages under `packages/backend/**`.
Each package ships its own migrations under `database/migrations/`. Laravel runs
migrations in **lexical filename order**, sorted globally across every
registered path.

The workspace convention has been to prefix migrations with timestamps
(`2026_07_15_120000_...`) so ordering falls out of the timestamp. That works
UNTIL two facts collide:

- **Packages evolve independently.** `packages/backend/access/rbac` and
  `packages/backend/access/delegation` were authored on separate days; their
  base migrations carry different timestamps. If delegation's `role_delegations`
  migration accidentally sorts before rbac's `roles` migration, the FK on
  `role_id` fails.
- **Cross-package FKs are legitimate.** Every domain row FKs into either
  `tenants`, `users`, `roles`, `permissions`, or one of the other 12
  central-plane rows. Every one of those parents lives in a DIFFERENT package.
  Filename-timestamp ordering enforces the correct global order only by
  accident.

Concrete pain surfaced during ADR-0031 E9 execution
(`.kiro/reports/ emit-e9-drop-migrations.py`): the new drop-column migrations
were timestamped `2026_07_22_...` so they'd run AFTER the base migrations at
`2026_07_15_...`. Coincidentally correct — but not by declaration.

The Laravel migrator has NO awareness of which package owns which table. When a
migration fails on a foreign key that doesn't exist yet, the error surfaces as
`SQLSTATE[42P01]: Undefined table` — the operator has to grep to find which
package should have run first.

Three requirements:

- **Explicit dependencies at the migration LEVEL.** A migration that needs
  `tenants` to exist should declare it, not rely on a coincidence of timestamps.
- **Boot-time verification.** `php artisan migrate` should fail LOUDLY with
  "migration X depends on Y which hasn't run" instead of silently running Y's
  SQL against a schema that violates its FK contract.
- **Zero manual DAG maintenance.** Every dependency edge is expressed as a
  declarative attribute in code; the migrator builds the DAG from what's
  discovered. No hand-authored order file.

## Options considered

### Option A — Timestamp-only ordering (rejected, status quo)

Continue relying on filename timestamps. Base migrations at 2026_07_15, drop
migrations at 2026_07_22, additive migrations at 2026_07_30, etc.

**Pros.**

- Zero framework code — Laravel already sorts by filename.
- Every migration is self-contained; no cross-file wiring.
- Familiar to every Laravel developer.

**Cons.**

- **Implicit — the ordering is invisible in code.** Reading `role_delegations`
  doesn't tell you it needs `roles` first. The operator learns via the FK
  failure at deploy time.
- **Fragile at PR review.** Adding a new migration means eyeballing the
  timestamp against every possibly-related base migration across ~90 packages.
  Zero automation.
- **Reversal is worse.** Reverting a migration by moving its timestamp earlier
  doesn't reverse the actual dependency graph — it just changes the sort order.

**Rejected — the status quo is what we're trying to fix.**

### Option B — Manual `docs/data/migration-order.md` DAG (rejected)

One workspace-wide markdown file lists every migration in the correct order,
with dependencies annotated. Laravel migrator reads this file before running.

**Pros.**

- Explicit dependencies expressed in one place.
- Reviewer can see the DAG at a glance.

**Cons.**

- Every new migration requires a hand-edit of the central file. High friction —
  reviewers forget; drift becomes normal.
- The order file duplicates information the code already has (the FK declaration
  IS the dependency).
- Merge conflicts on the order file every time two devs land migrations in
  parallel.

**Rejected.** Hand-maintained DAGs rot; the workspace has 90+ packages and 400+
migrations.

### Option C — `#[DependsOn]` attribute per migration (chosen)

Every migration that needs another migration to have run first declares it via
an attribute:

```php
#[DependsOn(RolesTable::class)]
#[DependsOn(TenantsTable::class)]
return new class() extends Migration
{
    public function up(): void { /* ... */ }
    public function down(): void { /* ... */ }
};
```

`RolesTable` + `TenantsTable` are **marker classes** authored per base migration
— one per created table. They live in the OWNING package's
`src/Database/Markers/` folder.

The Laravel migrator boot hook builds a DAG from the attributes at discovery
time (via `olvlvl/composer-attribute-collector`, same pathway as every other
attribute). Topological sort produces a total order that respects every declared
dependency. Filename timestamps become a TIEBREAKER for migrations at the same
DAG depth, not the primary ordering.

Boot-time verification: if any migration declares a `#[DependsOn]` on a marker
that no migration produces, boot fails with
`MigrationDependencyMissingException`.

**Chosen** because it delivers all three requirements (explicit + boot-
verified + zero manual DAG maintenance) using a mechanism the workspace already
uses for every OTHER cross-package coordination (`#[AsAction]`,
`#[AsController]`, `#[AsSeeder]`, `#[AsCommand]`, `#[AsRepository]`).

### Option D — Full topological sort inferred from FK declarations (rejected)

Parse every migration file's `$table->foreign()` calls; build the DAG
automatically from the FK graph. No attribute needed.

**Pros.**

- Zero manual annotation.
- The FK declaration IS the dependency.

**Cons.**

- **PHP static analysis of migration files is brittle.** Migrations use runtime
  `$table->foreign($col)->references()->on($table)` chains; extracting the
  target table without executing the migration requires full-fidelity PHP
  parsing. `nikic/php-parser` gets us close but not 100%.
- **Composite indexes + raw SQL escape the FK graph.** Any migration that ships
  `DB::statement('CREATE INDEX ...')` bypasses the analysis. We already have
  several (see approval_templates in E9).
- **Every framework-agnostic dependency vanishes.** Some migrations don't
  declare an FK but MUST run after another (e.g., a data-backfill migration that
  reads from an FK'd row). Attribute is the only way to express this.

**Rejected.** Too fragile + too limited.

## Decision

### D1 — Every base migration ships a RICH marker class carrying its dependencies

Every migration that CREATES a table ships a paired **marker class** under
`src/Database/Markers/` in the owning package. Unlike the empty- class shape
from the ADR's first draft, the marker is a rich data carrier — it declares:

- The migration filename it corresponds to.
- The table it produces.
- Every OTHER marker it depends on (via `#[DependsOn]`).

```php
<?php
// packages/backend/access/rbac/src/Database/Markers/RolesTable.php

declare(strict_types=1);

namespace Stackra\Access\Database\Markers;

use Stackra\Database\Migrations\Attributes\DependsOn;
use Stackra\Tenancy\Database\Markers\TenantsTable;
use Stackra\Application\Database\Markers\ApplicationsTable;

/**
 * Marker for the `roles` table.
 *
 * ## What this marker declares
 *
 *   * `MIGRATION` — the timestamped file that CREATES the table.
 *   * `TABLE`     — the physical table name.
 *   * `#[DependsOn(...)]` per direct parent — the DAG's incoming
 *     edges into this node.
 *
 * ## Why the attribute lives on the marker, not the migration
 *
 * Laravel migrations are anonymous classes (`return new class() {}`).
 * `olvlvl/composer-attribute-collector` cannot yield a stable FQCN
 * for anonymous classes, so `#[DependsOn]` on the migration itself
 * would not survive attribute discovery. The marker is a NAMED class
 * — discoverable + stable across PHP versions.
 */
#[DependsOn(TenantsTable::class)]
#[DependsOn(ApplicationsTable::class)]
final class RolesTable
{
    /** Migration file that produces this table. */
    public const string MIGRATION = '2026_07_15_120005_create_roles_table.php';

    /** Physical table name. */
    public const string TABLE = 'roles';
}
```

Naming: `<TableInStudlyCase>Table`. So `roles` → `RolesTable`,
`role_delegations` → `RoleDelegationsTable`. Every marker is discovered via
`DiscoversAttributes::forClass(DependsOn::class)`.

### D2 — Dependent migrations reference their marker via docblock

The migration file itself carries no attributes (attributes on anonymous classes
are unreliable). Instead the migration file's top-of-file docblock references
its marker so reviewers see the edge from the migration side too:

```php
<?php

/**
 * @file 2026_07_15_120001_create_role_delegations_table.php
 *
 * @description
 * Create the `role_delegations` table.
 *
 * Marker: {@see \Stackra\Access\Database\Markers\RoleDelegationsTable}.
 * Dependencies declared on that marker via #[DependsOn].
 */

declare(strict_types=1);

// ... regular anonymous-class migration body ...
```

Every base migration MUST have a paired marker; the boot-time DAG resolver flags
a missing marker as a **warning** (not fatal — legacy migrations pre-dating this
ADR still run). Every NEW migration adds a marker in the same commit.

Drop-column + additive-column migrations don't need their own marker — they
operate on a table whose marker already exists. If a drop migration itself
becomes a dependency for a later migration (rare), it can share the parent
marker without ambiguity.

### D3 — Boot-time DAG resolution

`packages/backend/framework/database` ships a `MigrationDagResolver` service
that:

1. Runs at `MigrationRepositoryInterface::migrations()` — before Laravel starts
   running any migration.
2. Discovers every `#[DependsOn]` via `DiscoversAttributes` (compile- time index
   — zero runtime cost).
3. Builds a directed graph: nodes = migration files; edges = `#[DependsOn]`
   declarations resolved through the marker class → the migration that creates
   the marker's table.
4. Detects cycles — throws `MigrationDependencyCycleException` with the cycle
   path in the message.
5. Topologically sorts the DAG.
6. Uses filename timestamps as a stable tiebreaker for migrations at the same
   DAG depth. Timestamps still matter — they're just no longer the PRIMARY
   ordering.
7. Returns the sorted list to Laravel's migrator.

Boot fails LOUDLY with actionable errors when:

- A `#[DependsOn]` references a marker class no migration produces →
  `MigrationDependencyMissingException`.
- The DAG contains a cycle → `MigrationDependencyCycleException`.
- A migration file is missing its `#[DependsOn]` for a table it FKs against →
  **warning** (not fatal — legacy migrations without full annotation still run;
  the warning surfaces the gap for follow-up).

### D4 — Verification via a dedicated Pest test

`packages/backend/framework/database/tests/Feature/MigrationDagTest.php` tests:

- Every migration under `packages/backend/**` resolves to a valid DAG.
- No cycles exist.
- Every FK declaration in every migration has a matching `#[DependsOn]`
  (grep-based cross-check).

Test runs in the workspace-wide CI matrix (see `.github/workflows/php.yml`) so
cycles + missing declarations fail PRs before they land.

### D5 — Legacy migrations gain markers incrementally

Every migration under `packages/backend/**` gets a marker + `#[DependsOn]`
declarations. The E9 batch already touches 11 migrations — those land markers in
the same commit. Every OTHER migration gets its marker in a bulk sweep landed as
`.kiro/reports/emit-migration-markers.py` (Sprint 3 follow-up).

Until every migration has markers, the resolver DEFAULTS to timestamp ordering
for un-annotated migrations. Annotated + un-annotated coexist during the
migration window.

### D6 — Cross-package markers via the framework tier

Marker classes cross package boundaries. `access/delegation` declares
`#[DependsOn(TenantsTable::class)]` where `TenantsTable` lives in
`stackra/tenancy`. The require + path-repo entries are already in place (every
backend package requires the framework tier); marker imports just piggy-back on
the existing composer graph.

If package A doesn't already require package B but A's migration depends on B's
table, adding the require + path-repo is part of landing the `#[DependsOn]`.
That surfaces a real coupling that was previously invisible.

## Consequences

**Positive.**

- Migration order is EXPLICIT in code. Reading
  `create_role_delegations_table.php` immediately shows every table it depends
  on.
- Boot verification catches missing dependencies BEFORE production. A
  `#[DependsOn(NonexistentTable::class)]` fails at
  `php artisan migrate --pretend` — no SQL runs.
- Cycles fail LOUDLY with a path in the message. Debugging is grep-able.
- Filename timestamps stay useful as a tiebreaker + audit trail; they just
  aren't load-bearing on ordering.
- Uniform with every other attribute-first coordination in the codebase
  (`#[AsAction]`, `#[AsController]`, `#[AsSeeder]`, etc.). Zero new concepts for
  developers to learn.
- Cross-package coupling becomes visible. If migration X in package A
  `#[DependsOn]`'s package B's marker, the composer require MUST exist —
  surfaces implicit dependencies that were previously hidden.

**Negative.**

- Every existing migration needs a marker + `#[DependsOn]` annotation in a
  sweep. Estimated ~400 migrations × 2 minutes each ≈ 13 hours of one-time
  effort. Automated via `.kiro/reports/emit-migration-markers.py` (parses FK
  declarations, emits the attributes).
- Every NEW migration must ship a marker (if it creates a table) OR declare
  `#[DependsOn]` (if it uses one). Reviewer catches this; eventually the
  PostCommit hook rejects PRs that create a table without a marker.
- Slight runtime cost at boot: DAG resolution runs once per `artisan migrate`.
  Attribute discovery is O(1) via olvlvl/composer-attribute-collector; toposort
  is O(nodes + edges). For 400 migrations + ~800 edges: <10 ms. Immaterial.

**Neutral.**

- The composer path-repo graph is unchanged. Every marker lives in the package
  that owns the underlying table; every dependent migration already requires
  that package (or SHOULD require it — surfaces the gap).
- Migration reversal (`migrate:rollback`) uses the same DAG in reverse
  topological order. Downstream drops before upstream tables.

## Follow-up work

- **Foundation attribute + resolver** — implement
  `Stackra\Foundation\Migrations\Attributes\DependsOn` +
  `Stackra\Database\Migrations\MigrationDagResolver` in
  `packages/backend/framework/database/`.
- **Marker emitter** — `.kiro/reports/emit-migration-markers.py` parses every
  migration's `Schema::create(...)` call, emits the paired marker class, and
  rewrites the migration file with the required `#[DependsOn]` attributes.
- **CI test** —
  `packages/backend/framework/database/tests/Feature/ MigrationDagTest.php`
  verifying every migration + marker + FK triangulates.
- **E9 augmentation** — the 11 E9 drop-column migrations gain their
  `#[DependsOn]` in the same commit that lands ADR-0035 + the framework
  attribute.
- **Steering update** — `.kiro/steering/models.md` §Migrations gains an ADR
  anchor pointing here + a "every base migration ships a marker" rule.

## Related work

- [ADR-0011](0011-seeder-discovery-via-attribute.md) — the seeder pattern
  ADR-0035 mirrors. Seeders use `#[AsSeeder]`; migrations gain `#[DependsOn]` —
  same attribute-first shape.
- [ADR-0028](0028-runtime-target-laravel-octane.md) — Octane runtime. Attribute
  discovery happens at compile time via `olvlvl/composer-attribute-collector`,
  so runtime DAG resolution is Octane-safe.
- [ADR-0031](0031-application-id-central-plane-extension.md) — the E9 batch was
  the concrete pain point that motivated this ADR. Every one of the 11
  drop-column migrations now needs a `#[DependsOn]`.
- [ADR-0032](0032-six-service-split.md) — the six-service split. Each service
  builds its own DAG independently (per-service DB), but the framework tier +
  shared packages contribute markers used across services.
- `.kiro/steering/models.md` — the models steering that will gain the
  base-migration-marker rule.
- `.kiro/steering/php-attributes.md` — the attribute-first authoring pattern.
- `packages/backend/foundation/src/Discovery/AttributeDiscovery.php` — the
  discovery wrapper the resolver uses.
