---
inclusion: fileMatch
fileMatchPattern: "**/{Models,Contracts/Data,database/migrations,Repositories,Contracts/Repositories}/**/*.php"
---

# Models, migrations, and column constants

> **ADR anchor.** Migration dependency ordering (transitive resolution across
> the ~90-package boot graph) is codified by
> [ADR-0035](../../docs/adr/0035-migration-dependency-ordering.md). Every base
> migration ships a marker class under `src/Database/Markers/`; every dependent
> migration declares `#[DependsOn(<Table>Table::class)]`. See §Migration
> ordering below.

Reference implementation:
`old/backend/modules/reviewing/**/{Models,Contracts/Data,database/migrations,Repositories}/*.php`.
Match that style when writing anything in `Models/`, `Contracts/Data/`,
`database/migrations/`, `Repositories/`, or `Contracts/Repositories/`.

## 1. Column constants live on `Contracts/Data/<Model>Interface`

Every model has a sibling interface under
`src/Contracts/Data/<Model>Interface.php` that declares:

- `TABLE` — table name string
- `PRIMARY_KEY` — usually `'id'`
- `KEY_TYPE` — `'string'` for ULID/UUID, `'int'` for auto-increment
- One `ATTR_<COLUMN>` constant per column

**The model implements this interface.** All migrations and repositories read
column names via `ModelInterface::ATTR_*` — never raw strings.

### Minimal interface shape

```php
<?php

declare(strict_types=1);

namespace Stackra\<Package>\Contracts\Data;

/**
 * Table shape for the `<table>` table.
 */
interface <Model>Interface
{
    public const string TABLE       = '<table>';
    public const string PRIMARY_KEY = 'id';
    public const string KEY_TYPE    = 'string';

    public const string ATTR_ID         = 'id';
    public const string ATTR_TENANT_ID  = 'tenant_id';
    // … one per column, ending with the audit/timestamp block:
    public const string ATTR_CREATED_BY = 'created_by';
    public const string ATTR_UPDATED_BY = 'updated_by';
    public const string ATTR_DELETED_BY = 'deleted_by';
    public const string ATTR_CREATED_AT = 'created_at';
    public const string ATTR_UPDATED_AT = 'updated_at';
    public const string ATTR_DELETED_AT = 'deleted_at';
}
```

### Model — use the interface

```php
#[Table(
    name: <Model>Interface::TABLE,
    key: <Model>Interface::PRIMARY_KEY,
    keyType: <Model>Interface::KEY_TYPE,
)]
#[Fillable([
    <Model>Interface::ATTR_TENANT_ID,
    <Model>Interface::ATTR_NAME,
    // …
])]
final class <Model> extends Model implements Auditable, <Model>Interface
{
    // …
}
```

### Migration — use the interface

```php
Schema::create(<Model>Interface::TABLE, function (Blueprint $table): void {
    $table->string(<Model>Interface::ATTR_ID, 64)->primary();
    $table->string(<Model>Interface::ATTR_TENANT_ID)->nullable()->index();
    $table->string(<Model>Interface::ATTR_NAME);
    // …
});
```

### Repository — use the interface

```php
$this->query()
    ->where(<Model>Interface::ATTR_TENANT_ID, $tenantId)
    ->where(<Model>Interface::ATTR_STATUS, StatusEnum::Active)
    ->first();
```

## 2. Docblock style — minimal, matching old/backend

Reference files (read before writing new ones):

- `old/backend/modules/reviewing/Attendance/src/Models/Attendance.php`
- `old/backend/modules/reviewing/Attendance/src/Contracts/Repositories/AttendanceRepositoryInterface.php`
- `old/backend/modules/reviewing/Attendance/src/Repositories/EloquentAttendanceRepository.php`
- `old/backend/modules/reviewing/Attendance/database/migrations/2026_07_07_000014_create_attendance_table.php`

Rules:

- **Class docblock** — 3-8 lines. State what the class is and (if useful) one
  implementation note. Never write "## Sections" essays.
- **Method docblock** — 1-3 lines of prose, then `@param` / `@return` /
  `@throws`. No multi-paragraph explanations.
- **Column comments in migrations** — only when the column is non-obvious. Don't
  restate what the column name already says.
- **No `@see` chains** on every field. One `@see` at the class level is enough
  when it points to something genuinely useful.
- **No `## Why` / `## Rationale` sections** on every field or method. If a
  decision needs explaining, put it in an ADR under `docs/adr/`, not inline.
- **No `@property` dumps on the class** — the `implements <Model>Interface`
  gives IDEs the columns; skip the redundant `@property string $name` chain.
- **File header** — `declare(strict_types=1);` at the top. Optional file-level
  docblock for a one-line description; skip it if the class docblock already
  covers it.

### Reference model shape (minimal)

```php
<?php

declare(strict_types=1);

namespace Stackra\<Package>\Models;

use Stackra\<Package>\Contracts\Data\<Model>Interface;
use Stackra\<Package>\Database\Factories\<Model>Factory;
use Stackra\Foundation\Concerns\HasPrefixedUlid;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see <Model>}.
 *
 * One-line note about anything non-obvious (e.g. "Kill switches are
 * platform-scoped — no BelongsToTenant.").
 */
#[Table(
    name: <Model>Interface::TABLE,
    key: <Model>Interface::PRIMARY_KEY,
    keyType: <Model>Interface::KEY_TYPE,
)]
#[Fillable([
    <Model>Interface::ATTR_TENANT_ID,
    <Model>Interface::ATTR_NAME,
])]
#[UseFactory(<Model>Factory::class)]
#[WithoutIncrementing]
final class <Model> extends Model implements AuditableContract, <Model>Interface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /** @var array<string, string> */
    protected $casts = [
        <Model>Interface::ATTR_STATUS => StatusEnum::class,
    ];
}
```

### Reference migration shape (minimal)

```php
<?php

declare(strict_types=1);

use Stackra\<Package>\Contracts\Data\<Model>Interface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `<table>` table.
 */
return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(<Model>Interface::TABLE, function (Blueprint $table): void {
            $table->string(<Model>Interface::ATTR_ID, 64)->primary();
            $table->string(<Model>Interface::ATTR_TENANT_ID)->index();
            $table->string(<Model>Interface::ATTR_NAME);
            // …
            $table->string(<Model>Interface::ATTR_CREATED_BY)->nullable();
            $table->string(<Model>Interface::ATTR_UPDATED_BY)->nullable();
            $table->string(<Model>Interface::ATTR_DELETED_BY)->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(<Model>Interface::TABLE);
    }
};
```

## 3. What the old backend already codified — reuse it

- `AbstractEloquentRepository` (from `stackra/crud`) is the base every
  `Eloquent<Model>Repository` extends. Never re-implement `find` / `findOrFail`
  / `all` / `paginate` / `create` / `update` / `delete` / `restore` on a
  per-model basis.
- Repository interface extends
  `Stackra\Crud\Contracts\RepositoryInterface<Model>` and adds only
  domain-specific finders.
- Repositories reach columns via `ModelInterface::ATTR_*` — never string
  literals.
- Every model composes `Auditable` from `owen-it/laravel-auditing` and
  implements its contract. Don't invent per-package audit-log tables — the
  shared `audits` table is the audit trail.

## 4. Anti-patterns

| Anti-pattern                                                | Preferred                                                                        |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `->where('tenant_id', $id)` in a repo                       | `->where(<Model>Interface::ATTR_TENANT_ID, $id)`                                 |
| `#[Fillable('name', 'email')]`                              | `#[Fillable([<Model>Interface::ATTR_NAME, <Model>Interface::ATTR_EMAIL])]`       |
| `$table->string('name')` in a migration                     | `$table->string(<Model>Interface::ATTR_NAME)`                                    |
| Multi-section class docblock with `## Why` / `## Rationale` | 3-8 line class docblock; put rationale in an ADR                                 |
| Per-package `xyz_audit_log` table                           | Compose `Auditable` on the writable model; use shared `audits` table             |
| `@property string $name` dump on the model                  | Skip — `implements <Model>Interface` already documents columns                   |
| Duplicating `paginate` / `findById` on the repo interface   | Extend `RepositoryInterface<Model>` from `stackra/crud`; add only domain finders |

## 5. File structure and traits — one file per model

Every model is a **single file** in `src/Models/<Model>.php`. Do NOT split a
model into per-model trait files
(`Models/Traits/<Model>/{HasTraits,HasRelations,HasGetters,HasSetters}.php`).
That pattern has zero precedent in this codebase and has real costs:

- PHPStan / Larastan analysis works worse across split traits than across a
  single file.
- Directory sprawl — 4 models × 4 trait files = 16 files with an implicit
  compilation order.
- PHP does not enforce the split, so a relation ends up in `HasGetters` on the
  first tired PR and the "structure" drifts.
- Fat models are a symptom of too much logic on the model — `domain-patterns.md`
  §1 already forbids business logic there.

### Where traits DO live in this codebase

`Concerns/` — **reusable, cross-model, single-responsibility** traits composed
by many models. Examples that ship:

```
packages/framework/database/src/Concerns/
├── HasMetadata.php          ← used by 10+ models across packages
├── HasPrefixedUlid.php      ← used by every ULID-keyed model
├── HasTranslations.php      ← used by models with i18n columns
├── HasSystemFlag.php        ← used by role/permission tables
├── InteractsWithMedia.php   ← used by every media-attached model
└── HasMockableStorage.php   ← used by fixture-first models
```

Per-domain examples:

```
stackra-backend/apps/api/src/modules/tenancy/src/Concerns/BelongsToTenant.php
old/backend/modules/reviewing/Branch/src/Concerns/BelongsToBranch.php
```

The right axis of split is **per capability, shared across many models** — never
**per model, split into four capabilities**.

### Canonical package layout for models

```
packages/framework/<package>/src/
├── Concerns/                        ← reusable traits (one trait = one capability)
│   ├── BelongsToFeature.php         ← composed by every model that FKs to `feature_definitions`
│   └── HasKillSwitchState.php       ← if two+ models share the same lifecycle
├── Contracts/
│   └── Data/
│       └── <Model>Interface.php     ← TABLE, PRIMARY_KEY, ATTR_* column constants (see §1)
├── Models/
│   ├── Feature.php                  ← single file, composes traits + implements interface
│   ├── FeatureOverride.php
│   ├── FeatureRollout.php
│   └── FeatureKillSwitch.php
```

The model itself stays flat: traits + `#[Fillable]` + relations + `casts()` +
one or two `#[Scope]` methods. When it grows past ~200 lines, the fix is:

1. Move behaviour out to actions/services (per `domain-patterns.md`).
2. Move accessor/mutator logic into `Cast` classes.
3. Extract a genuinely reusable capability into a new `Concerns/` trait — one
   that at least two models will compose.

Splitting a single model into four trait files is not on the list.

### When per-model split IS legitimate (rare)

Only when ALL of the following hold:

1. Model is 500+ lines AND
2. The lines are structural (relations, accessors, scopes) — not business logic
   AND
3. Every proposed split section is genuinely one concern (not a dumping ground).

Even then, prefer moving relations behind interfaces or accessors into `Cast`
classes over creating per-model trait files. In practice, no model in this
codebase meets the threshold.
