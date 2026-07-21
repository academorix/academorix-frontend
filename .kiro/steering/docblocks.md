---
inclusion: fileMatch
fileMatchPattern: "**/*.php"
---

# Docblock standard

Three files are the canonical references. Match their style:

- **Procedural / config files** → `stackra-backend/apps/api/config/auth.php`
  (file-level `@file` + `@description`, section-comment banners inside)
- **Factory classes** →
  `old/backend/modules/reviewing/Access/database/factories/PermissionFactory.php`
  (class docblock only, generic-typed `@extends`, per-property `@var`,
  per-method `@return array<...>`)
- **Repository classes** →
  `old/backend/modules/reviewing/User/src/Repositories/EloquentPlatformUserRepository.php`
  (class docblock with `## What this class owns`, per-method `{@inheritDoc}` +
  supplement)
- **Enum with metadata attributes** →
  `stackra-backend/packages/framework/enum/src/Enum.php` (`@category`,
  `@since`, `@author` Magento-style tags on shared library code)

Read those before writing anything. Rules below generalise what they codify.

## Universal rules

1. **File header shape.**
   - `<?php` on line 1.
   - Line 2: blank OR the file-level docblock's opening `/**`.
   - `declare(strict_types=1);` after the docblock (or on line 3 when no
     file-level docblock).
   - `namespace` after `declare`. Imports alphabetical. Class docblock
     immediately above the class declaration.

2. **File-level `@file` docblock — when it's required.**
   - **YES** — procedural files: `config/*.php`, `database/migrations/*.php`,
     `database/seeders/*.php`, `routes/*.php`. Uses `@file` + `@description`
     block, 2-3 paragraphs.
   - **NO** — class files (models, factories, repositories, services,
     interfaces, enums, VOs, attributes, actions, traits, providers, exceptions,
     DTOs). The class docblock IS the file description.

3. **Docblock every symbol.** Every class, interface, trait, enum, method
   (public + protected + private), property, and constant gets a docblock. The
   docblock may be one line — but it must be present. No exceptions for
   "obvious" symbols; consistency > brevity.

4. **Every tag adds a fact.** `@param string $flag The flag.` restates the
   signature and is banned.
   `@param string $flag Dot-separated flag identifier (matches features.name).`
   contributes a constraint. Skip the tag when you have nothing to add — but
   skip the tag, not the whole docblock.

5. **`## Section` headings are welcome** in class docblocks when the class has
   multiple facets worth naming (what it owns, consumers, invariants, wiring).
   See the `EloquentPlatformUserRepository` reference. Use them when they aid
   navigation; skip when the class is a one-liner.

6. **Name consumers, invariants, generation origins.** Docblocks are richer than
   "does X" — they say who calls this, what invariants matter, where the class
   came from (generator, ADR, prior module).

7. **Generic types on every generic tag.** `@extends Factory<Permission>`,
   `@var class-string<Model>`, `@return HasMany<Related, $this>`,
   `@return array<string, mixed>`, `@return Collection<int, User>`,
   `@return list<string>`.

8. **`{@inheritDoc}` on interface implementations.** When the interface method's
   docblock carries the contract, don't repeat it. `{@inheritDoc}` + a
   supplementary paragraph for implementation-specific behaviour.

9. **Magento-style tags on shared library code.** Framework packages under
   `packages/framework/*` follow the Magento 2 pattern for cross-cutting library
   code: `@category`, `@since`, `@author` on the class docblock. App code
   (`apps/api/*`, `apps/ai-service/*`) omits these — the class docblock lives
   inside a single-owner boundary.

## Docblock coverage — what needs one

### Classes / interfaces / traits / enums — always

Class docblock is required on every declaration. 3-20 lines depending on facets.
See per-type templates below.

### Constants

Every `public const` and `private const` gets a `/** ... */` docblock. One line
for self-explanatory constants (`public const CODE = 'x.y';`); multi-line when
semantics need explaining.

```php
/**
 * Stable machine-readable error code emitted on the JSON envelope.
 */
public const CODE = 'feature_flags.disabled';

/**
 * Translation key for the humanised message.
 */
public const TRANSLATION_KEY = 'feature-flags::errors.disabled';

/**
 * Hard cap on kill-switch resolution cache TTL, regardless of the
 * flag's declared `cache_ttl`. Requirement 10.7.
 */
private const int KILL_SWITCH_MAX_TTL_SECONDS = 60;
```

**Exception:** `Contracts/Data/<Model>Interface` column constants skip inline
docblocks — the class docblock explains the table and the column name is
self-documenting. This is the ONE exception to "docblock every constant".

### Properties

Every property gets a docblock with `@var Type`. When the property has
constructor promotion, doc the `@param` on the constructor docblock (see Data
DTO template).

```php
/**
 * The concrete Eloquent model this repository builds.
 *
 * @var class-string<FeatureOverride>
 */
protected $model = FeatureOverride::class;

/**
 * Cast map — enums restored on hydrate.
 *
 * @var array<string, string>
 */
protected $casts = [
    FeatureOverrideInterface::ATTR_DECISION => OverrideDecision::class,
];
```

### Methods — public, protected, private

Every method — visibility does not matter — carries a docblock.

- 1-line description minimum.
- `@param` on every non-obvious parameter (skip when signature is
  self-documenting AND no constraint applies).
- `@return` on every method with a non-void return type.
- `@throws` on every raise path the caller must know about.
- `@see` for cross-references.
- `@throws` marks the exception class; do not marker "throws when...". The class
  name IS the fact.

```php
/**
 * Return the deepest-matching override row.
 *
 * "Deepest" = the row whose `scope_level` has the highest
 * `sort_order` on `scope_definitions` (Requirement 3.3).
 *
 * @param  string     $flag  Normalised flag identifier.
 * @param  ScopePath  $path  Caller's active `(scope_level, scope_value)` chain.
 * @return FeatureOverride|null  Deepest-matching row, or null.
 *
 * @throws \Illuminate\Database\QueryException  When the underlying store errors.
 */
public function findMatching(string $flag, ScopePath $path): ?FeatureOverride
{
    // ...
}

/**
 * Read a nullable string attribute, returning `null` for missing / empty values.
 *
 * @param  string  $key  Column key drawn from the model interface.
 * @return string|null   The trimmed string value, or null when unset.
 */
private static function nullableString(Model $model, string $key): ?string
{
    // ...
}
```

## Per file-type standard

### Config files — full `@file` header

```php
<?php

/**
 * @file config/feature-flags.php
 *
 * @description
 * Runtime knobs for the feature-flags package. Every downstream
 * publishes this file via `vendor:publish --tag=feature-flags-config`.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Cache TTL
    |--------------------------------------------------------------------------
    |
    | Default cache TTL in seconds when a flag's #[AsFeatureFlag]
    | attribute did not declare an explicit cacheTtl.
    */
    'cache_ttl' => env('FEATURE_FLAGS_CACHE_TTL', 300),
];
```

- File docblock: 2-4 paragraphs. What the file configures + a non-obvious
  deviation from the framework default.
- Section banners: the `/* |----| Section |----| ... */` block for every logical
  group. Prose inside names env inputs + defaults.

### Migrations — full `@file` header

```php
<?php

/**
 * @file database/migrations/2025_11_01_000002_create_feature_overrides_table.php
 *
 * @description
 * Per-tenant, per-scope explicit allow/deny rows consumed by the
 * resolver's Override layer. Unique on `(tenant_id, flag,
 * scope_level, scope_value)` — at most one active override per
 * subject per flag.
 */

declare(strict_types=1);

use Stackra\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    /**
     * Run the migration.
     */
    public function up(): void
    {
        Schema::create(FeatureOverrideInterface::TABLE, function (Blueprint $table): void {
            $table->string(FeatureOverrideInterface::ATTR_ID, 30)->primary();
            // …
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists(FeatureOverrideInterface::TABLE);
    }
};
```

- File docblock: 2-4 lines. What the table is + one non-obvious index or
  constraint.
- `up()` / `down()`: single-line docblock verbatim.

### Enums

Two shapes. Use **Metadata** shape when cases have labels or descriptions
consumers read at runtime; use **Simple** shape otherwise. Never mix — an enum
is one shape or the other.

#### Simple enum

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Enums;

use Stackra\Enum\Enum;

/**
 * Explicit allow/deny decision persisted on `feature_overrides` rows.
 *
 * ## Cases
 *
 *  * {@see self::Allow}  — the resolver returns `true` when this
 *    row wins the Override layer's deepest-match.
 *  * {@see self::Deny}   — the resolver returns `false` with source
 *    `override`. The middleware raises HTTP 403 with error code
 *    `feature_flags.override_denied` (Requirement 5.5).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
enum OverrideDecision: string
{
    use Enum;

    /**
     * Allow — the row explicitly enables the flag for this subject.
     */
    case Allow = 'allow';

    /**
     * Deny — the row explicitly disables the flag for this subject.
     */
    case Deny = 'deny';
}
```

- Class docblock: 4-12 lines. What the enum represents + a `## Cases` bullet
  list naming each case's semantics.
- `use Enum;` — always. Every enum in this codebase composes it.
- Per-case docblock: **required**, one line. The enum-level `## Cases` list may
  repeat the same information more richly; the per-case doc anchors the case in
  code searches.
- Magento tags: `@category` + `@since` on framework packages.

#### Metadata enum (uses `#[Label]` / `#[Description]`)

Compose `#[Meta]` on the enum class and `#[Label]` / `#[Description]` on each
case whenever consumers need a human-readable label or a longer description.
`->label()` + `->description()` come from the `Enum` trait via `Metable`.

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Registry-level classification of a feature flag.
 *
 * ## Cases
 *
 *  * {@see self::KillSwitch} — emergency shut-off flag; platform-scoped.
 *  * {@see self::Override}   — explicit allow/deny per subject.
 *  * {@see self::Rollout}    — percentage-based enablement.
 *  * {@see self::PlanGate}   — tied to an entitlement on the tenant's plan.
 *
 * Not the same as the resolver's deciding source — a flag with
 * `kind = PlanGate` can still be decided by the `KillSwitch` layer
 * in a particular evaluation.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum FlagKind: string
{
    use Enum;

    /**
     * Emergency shut-off — platform-wide row that wins over every other layer.
     */
    #[Label('Kill Switch')]
    #[Description('Emergency shut-off row that wins over every other resolver layer.')]
    case KillSwitch = 'kill_switch';

    /**
     * Explicit allow/deny for a specific subject.
     */
    #[Label('Override')]
    #[Description('Explicit allow/deny row targeting a specific subject.')]
    case Override = 'override';

    /**
     * Percentage-based enablement across a subject population.
     */
    #[Label('Rollout')]
    #[Description('Percentage-based enablement over a subject population.')]
    case Rollout = 'rollout';

    /**
     * Plan-gated — enabled when the tenant's subscription grants a matching entitlement.
     */
    #[Label('Plan Gate')]
    #[Description('Enabled when the tenant subscription grants the matching entitlement.')]
    case PlanGate = 'plan_gate';
}
```

- Every case carries `#[Label]` + `#[Description]` — never one without the
  other. If labels are added for one case, they are added for every case.
- Per-case docblock still required — the attribute is machine metadata; the
  docblock is source-code documentation.

### Interfaces — Contracts/Data/<Model>Interface

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Contracts\Data;

/**
 * Table shape for the `feature_overrides` table.
 *
 * Per-tenant, per-scope allow/deny rows consumed by the resolver's
 * Override layer. `scope_level` references `scope_definitions.slug`
 * and `scope_value` is the caller's `ScopeValue` at that level.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
interface FeatureOverrideInterface
{
    /**
     * Table name.
     */
    public const string TABLE = 'feature_overrides';

    /**
     * Primary key column.
     */
    public const string PRIMARY_KEY = 'id';

    /**
     * Primary key column type — string, ULID.
     */
    public const string KEY_TYPE = 'string';

    // ── Columns ───────────────────────────────────────────────

    public const string ATTR_ID          = 'id';
    public const string ATTR_TENANT_ID   = 'tenant_id';
    public const string ATTR_FLAG        = 'flag';
    public const string ATTR_SCOPE_LEVEL = 'scope_level';
    public const string ATTR_SCOPE_VALUE = 'scope_value';
    public const string ATTR_DECISION    = 'decision';
    public const string ATTR_REASON      = 'reason';
    public const string ATTR_EXPIRES_AT  = 'expires_at';
    public const string ATTR_CREATED_BY  = 'created_by';
    public const string ATTR_UPDATED_BY  = 'updated_by';
    public const string ATTR_DELETED_BY  = 'deleted_by';
    public const string ATTR_CREATED_AT  = 'created_at';
    public const string ATTR_UPDATED_AT  = 'updated_at';
    public const string ATTR_DELETED_AT  = 'deleted_at';
}
```

- Class docblock: 4-8 lines with `@category` + `@since`.
- `TABLE` / `PRIMARY_KEY` / `KEY_TYPE`: one-line docblock (they are still
  constants).
- Column constants: no inline docblock — the column name is self-documenting.
  THIS IS THE ONLY EXCEPTION to "docblock every constant".
- One `// ── Columns ──` divider between metadata and columns.

### Interfaces — Contracts/*Interface / Contracts/Repositories/*Interface

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\FeatureFlags\Models\FeatureOverride;
use Stackra\FeatureFlags\Support\ScopePath;

/**
 * Repository contract for {@see FeatureOverride}.
 *
 * Adds the resolver's hot-path finder on top of the base CRUD
 * surface. Consumers should type-hint the interface, not the
 * concrete `EloquentFeatureOverrideRepository`, so the container
 * can swap in a stub for tests.
 *
 * @extends RepositoryInterface<FeatureOverride>
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
interface FeatureOverrideRepositoryInterface extends RepositoryInterface
{
    /**
     * Return the deepest-matching override row for `$flag` under `$path`.
     *
     * "Deepest" means the row whose `scope_level` has the highest
     * `sort_order` on `scope_definitions` — user beats team beats
     * branch beats tenant beats global (Requirement 3.3).
     *
     * @param  string     $flag  Normalised flag identifier.
     * @param  ScopePath  $path  Caller's active `(scope_level, scope_value)` chain.
     * @return FeatureOverride|null  Deepest-matching row, or null when none applies.
     */
    public function findMatching(string $flag, ScopePath $path): ?FeatureOverride;
}
```

- Class docblock: 6-12 lines. Contract role + generic `@extends` tag + at least
  one consumer or invariant + Magento tags.
- Per-method: 2-4 line prose + `@param` on every parameter that adds info +
  `@return` + `@throws` when raised.

### Factories

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Database\Factories;

use Stackra\FeatureFlags\Models\FeatureOverride;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for {@see FeatureOverride}.
 *
 * Produces rows with `decision = deny` at `scope_level = tenant` by
 * default. Callers use factory states (`->userScope()`, `->allow()`,
 * `->expiring()`) for the common test variants.
 *
 * @extends Factory<FeatureOverride>
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class FeatureOverrideFactory extends Factory
{
    /**
     * The model this factory builds.
     *
     * @var class-string<FeatureOverride>
     */
    protected $model = FeatureOverride::class;

    /**
     * Return the default model attribute values.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // ...
    }
}
```

### Repositories — Eloquent implementations

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Repositories;

use Stackra\Crud\Repositories\AbstractEloquentRepository;
use Stackra\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Stackra\FeatureFlags\Contracts\Repositories\FeatureOverrideRepositoryInterface;
use Stackra\FeatureFlags\Models\FeatureOverride;
use Stackra\FeatureFlags\Support\ScopePath;
use Illuminate\Container\Attributes\Bind;

/**
 * Eloquent implementation of {@see FeatureOverrideRepositoryInterface}.
 *
 * ## What this class owns
 *
 * One domain query the resolver's `OverrideLayer` needs:
 *
 *   - {@see findMatching()} — deepest-wins lookup by
 *     `(flag, scope_level, scope_value)` under the active tenant
 *     scope. Called exactly once per flag evaluation.
 *
 * Bound to the interface via `#[Bind]` (attribute-first DI,
 * ADR 0006). No manual container wiring.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Bind(FeatureOverrideRepositoryInterface::class)]
final class EloquentFeatureOverrideRepository extends AbstractEloquentRepository implements FeatureOverrideRepositoryInterface
{
    /**
     * The concrete Eloquent model this repository owns.
     *
     * @return class-string<FeatureOverride>
     */
    protected function modelClass(): string
    {
        return FeatureOverride::class;
    }

    /**
     * Table name backing this repository.
     */
    protected function tableName(): string
    {
        return FeatureOverrideInterface::TABLE;
    }

    /**
     * {@inheritDoc}
     *
     * Deepest-wins: sort candidate rows by
     * `scope_definitions.sort_order` descending and return the
     * head. Tenant scope comes from `BelongsToTenant` on the model.
     */
    public function findMatching(string $flag, ScopePath $path): ?FeatureOverride
    {
        // ...
    }
}
```

### Value Objects — readonly classes

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Resolver;

use Stackra\FeatureFlags\Enums\ResolutionSource;

/**
 * Outcome of a single flag evaluation.
 *
 * Carries the boolean decision and the deciding layer name. The
 * middleware branches on `$source` — `plan_gate` yields HTTP 402;
 * every other source yields 403. Produced by every
 * `ResolverLayer::apply()` implementation.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final readonly class FeatureResolution
{
    /**
     * @param  bool    $value   The resolved decision — `true` when
     *                          the flag is on for this caller.
     * @param  string  $source  Deciding layer — backing value of
     *                          {@see ResolutionSource}.
     */
    public function __construct(
        public bool $value,
        public string $source,
    ) {}

    /**
     * Kill-switch terminator — always `(false, kill_switch)`.
     */
    public static function killSwitch(): self
    {
        return new self(false, ResolutionSource::KillSwitch->value);
    }
}
```

- Constructor: docblock with `@param` on every promoted property. The property
  doc lives on the constructor, not on the promoted property itself.
- Static factories: 1-2 line docblock.

### Attributes

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Attributes;

use Stackra\FeatureFlags\Enums\FlagKind;
use Attribute;

/**
 * Register a class as a feature flag.
 *
 * Scanned at `package:discover` by `FeatureFlagDiscovery`, which
 * upserts a row into `feature_definitions` and registers the flag
 * with Pennant. When the class exposes `resolve()` or `before()`,
 * those methods are wired as Pennant's class-based resolver;
 * otherwise the composed `FeatureResolver` runs.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsFeatureFlag
{
    /**
     * @param  string        $name         Stable dot-separated identifier (e.g. `feature_ai`).
     * @param  string|null   $description  Free-form description shown in admin surfaces.
     * @param  FlagKind      $kind         Registry-level classification.
     * @param  bool          $defaultOff   When `true` the class-default layer returns `false`.
     * @param  int|null      $cacheTtl     Per-flag cache TTL in seconds; `null` falls back to config.
     */
    public function __construct(
        public string $name,
        public ?string $description = null,
        public FlagKind $kind = FlagKind::PlanGate,
        public bool $defaultOff = true,
        public ?int $cacheTtl = null,
    ) {}
}
```

### Exceptions

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a required feature is off for the current caller.
 *
 * `RequireFeatureMiddleware` throws this whenever the checker
 * returns a false resolution. The `source` field on the context
 * envelope drives the HTTP status — `plan_gate` yields 402,
 * every other source yields 403.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class FeatureDisabledException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'feature_flags.disabled';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'feature-flags::errors.disabled';

    /**
     * Convenience factory used by the middleware's raise path.
     *
     * @param  string  $flag    The flag that was denied.
     * @param  string  $source  Deciding layer — backing value of {@see ResolutionSource}.
     */
    public static function forFlag(string $flag, string $source): self
    {
        return (new self("Feature '{$flag}' is disabled."))
            ->withContext(['flag' => $flag, 'source' => $source]);
    }
}
```

### Models

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Models;

use Stackra\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Stackra\FeatureFlags\Database\Factories\FeatureOverrideFactory;
use Stackra\FeatureFlags\Enums\OverrideDecision;
use Stackra\Foundation\Concerns\HasPrefixedUlid;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Mattiverse\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see FeatureOverride}.
 *
 * Per-tenant allow/deny row consumed by the resolver's Override
 * layer. Composes `BelongsToTenant` so every read/write is scoped
 * to the active tenant automatically.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Table(
    name: FeatureOverrideInterface::TABLE,
    key: FeatureOverrideInterface::PRIMARY_KEY,
    keyType: FeatureOverrideInterface::KEY_TYPE,
)]
#[Fillable([
    FeatureOverrideInterface::ATTR_TENANT_ID,
    FeatureOverrideInterface::ATTR_FLAG,
    FeatureOverrideInterface::ATTR_SCOPE_LEVEL,
    FeatureOverrideInterface::ATTR_SCOPE_VALUE,
    FeatureOverrideInterface::ATTR_DECISION,
    FeatureOverrideInterface::ATTR_REASON,
    FeatureOverrideInterface::ATTR_EXPIRES_AT,
])]
#[UseFactory(FeatureOverrideFactory::class)]
final class FeatureOverride extends Model implements AuditableContract, FeatureOverrideInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enum + datetime coercion on hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        FeatureOverrideInterface::ATTR_DECISION   => OverrideDecision::class,
        FeatureOverrideInterface::ATTR_EXPIRES_AT => 'datetime',
    ];

    /**
     * Sibling audit rows written by owen-it whenever this row mutates.
     *
     * @return HasMany<\OwenIt\Auditing\Models\Audit, $this>
     */
    public function audits(): HasMany
    {
        return $this->hasMany(\OwenIt\Auditing\Models\Audit::class);
    }
}
```

### Actions

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Actions\Overrides;

// ...

/**
 * `POST /api/v1/feature-flags/overrides` — create a per-subject override.
 *
 * Cross-tenant writes (payload's `tenant_id` disagreeing with the
 * active tenant) return HTTP 403 with error code
 * `feature_flags.cross_tenant_write`. Successful creates return
 * `201 FeatureOverrideData`.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[AsAction(name: 'feature-flags.overrides.create')]
#[Post('/api/v1/feature-flags/overrides')]
#[RequirePermission('feature-flags.overrides.manage')]
final class CreateOverride
{
    use AsController;

    /**
     * @param  FeatureOverrideRepositoryInterface  $overrides  Persistence boundary.
     */
    public function __construct(
        private readonly FeatureOverrideRepositoryInterface $overrides,
    ) {}

    /**
     * Handle the request.
     *
     * @param  CreateOverrideRequestData  $data  Validated payload.
     * @param  TenantContext              $ctx  Active tenant context.
     * @return FeatureOverrideData  The persisted override, rendered.
     *
     * @throws \Symfony\Component\HttpKernel\Exception\HttpException  On cross-tenant write.
     */
    public function __invoke(CreateOverrideRequestData $data, TenantContext $ctx): FeatureOverrideData
    {
        // ...
    }
}
```

- Constructor: docblock with `@param` per injected dependency.
- `__invoke`: full docblock with `@param` + `@return` + `@throws`.

### Traits — Concerns/

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Concerns;

/**
 * Attach to any AI tool class to gate its visibility behind a feature flag.
 *
 * `SensitiveTool` and `WritableTool` compose this trait so gated
 * tools drop out of the persona payload when the tenant lacks the
 * flag. Fail-closed: a checker exception hides the tool.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
trait GatesToolVisibility
{
    /**
     * Return the flag name that gates this tool.
     *
     * @return string|null  Flag name, or `null` when the tool is always visible.
     */
    public function requiresFeature(): ?string
    {
        return null;
    }
}
```

### Providers, Facades, Data DTOs

Data DTOs (Spatie) — attribute-first validation, see `php-attributes.md` §Spatie
Laravel Data. Every field carries Spatie validation + mapping attributes; no
`rules()` method, no inline validators.

```php
<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/feature-flags/overrides`.
 *
 * Wire format is snake_case; PHP property names are camelCase — the
 * `#[MapInputName]` mapper handles the bridge. The action rejects
 * a payload whose `tenantId` disagrees with the active tenant
 * before this DTO reaches the repository.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateOverrideRequestData extends Data
{
    /**
     * @param  string       $flag         Stable dot-separated flag identifier.
     * @param  string       $scopeLevel   `scope_definitions.slug` for the target level.
     * @param  string       $scopeValue   Concrete `ScopeValue` at `$scopeLevel`.
     * @param  string       $decision     One of `allow` / `deny`.
     * @param  string|null  $reason       Optional operator note.
     * @param  string|null  $expiresAt    ISO-8601 timestamp; null means never.
     */
    public function __construct(
        #[Required, StringType, Max(191)]
        public string $flag,

        #[Required, StringType, Max(64)]
        public string $scopeLevel,

        #[Required, StringType, Max(191)]
        public string $scopeValue,

        #[Required, In(['allow', 'deny'])]
        public string $decision,

        #[StringType, Max(500)]
        public ?string $reason = null,

        #[StringType]
        public ?string $expiresAt = null,
    ) {}
}
```

## Anti-patterns

| Anti-pattern                                                  | Correct                                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Class without docblock                                        | Class docblock, 3-20 lines                                                                        |
| Method without docblock (any visibility)                      | 1-line docblock minimum + `@return`                                                               |
| `public const CODE = 'x'` without docblock                    | Add `/** One-line description. */` — the ONE exception is `ATTR_*` on `Contracts/Data/*Interface` |
| `protected $model = X::class;` without `@var class-string<X>` | Add `@var class-string<Model>`                                                                    |
| Enum without `use Enum;`                                      | Every enum composes `Stackra\Enum\Enum`                                                        |
| Enum with `#[Label]` on one case but not others               | All-or-nothing rule (§Universal 8)                                                                |
| `@param string $flag The flag.` restating the signature       | Skip `@param` OR add a constraint / consumer to justify it                                        |
| `@return Model` without concrete class                        | `@return FeatureOverride                                                                          | null` (concrete + generic) |
| No `@extends Factory<Model>` on a factory                     | Always add — PHPStan needs it                                                                     |
| Data class with `public function rules(): array`              | Use `#[Required]`, `#[StringType]`, `#[Max]`, `#[In]`, ... on properties                          |
| Data class with `protected static function messages(): array` | Use `#[Rule(..., message: '...')]` on the property                                                |
| Repeating the interface docblock on the impl                  | `{@inheritDoc}` + a paragraph                                                                     |
| Missing `@category` / `@since` on `packages/framework/**`     | Add them — Magento-style tags on shared library code                                              |
| `## Section` heading on a 2-line VO class docblock            | Headings only earn their space in multi-facet classes                                             |
