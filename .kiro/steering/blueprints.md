---
inclusion: fileMatch
fileMatchPattern: "packages/framework/database/src/Schema/**/*.php"
---

# Database blueprints — `#[AsDatabaseBlueprint]` + invokable

Blueprints are attribute-discovered classes that register Laravel `Blueprint`
macros at framework boot. Each blueprint contributes ONE macro family
(`->uuidPrimary()`, `->prefixedUlid()`, `->userstamps()`, etc.).

This is the pattern codified by
[ADR-0007](../../docs/adr/0007-blueprint-invoke-vs-register.md). One entry
point, one attribute, one class per macro family. No static `register()`.

## Location + naming

- Every blueprint lives under
  `packages/framework/database/src/Schema/*Blueprint.php`.
- Class name is `<Concept>Blueprint`: `UuidableBlueprint`,
  `UserstampsBlueprint`, `PrefixedUlidBlueprint`, `SoftDeletesBlueprint`.
- Namespace: `Academorix\Database\Schema`.
- `final class` — leaves. No blueprint subclasses another blueprint.

## The contract

Every blueprint follows this exact shape:

```php
<?php

declare(strict_types=1);

namespace Academorix\Database\Schema;

use Academorix\Database\Attributes\AsDatabaseBlueprint;
use Illuminate\Database\Schema\Blueprint;

/**
 * Registers the `->uuidPrimary()` macro on {@see Blueprint}.
 *
 * Consumers call `$table->uuidPrimary()` inside a migration to lay
 * down a UUID-typed primary key with the repo's canonical
 * constraints (indexed, non-null, no auto-increment).
 *
 * @category Database
 *
 * @since    0.1.0
 */
#[AsDatabaseBlueprint]
final class UuidableBlueprint
{
    /**
     * Register the macro. Called by the database service provider's
     * discovery loop at boot; can also be invoked directly in tests.
     */
    public function __invoke(): void
    {
        Blueprint::macro('uuidPrimary', function () {
            /** @var Blueprint $this */
            $this->uuid('id')->primary();
        });
    }
}
```

Line-by-line contract:

- `final class` — no inheritance.
- `#[AsDatabaseBlueprint]` — the discovery marker. Only class-level target.
- ONE public method: `__invoke(): void`. No return value — macro registration is
  a side effect.
- NO static `register()` method. NO `resolve()` alias. NO `bootMacros()`. The
  instance-level `__invoke()` is the ONLY entry point.
- Class docblock names the macro family + describes what consumers get
  (call-site example).
- Magento-style `@category Database` + `@since` tags — framework package
  convention (`.kiro/steering/docblocks.md` §Universal 9).

## Why `__invoke()` and not `register()`

Three reasons codified in ADR-0007:

1. **Attribute discovery already treats the class as invokable.** The boot loop
   instantiates the blueprint via the container and calls `($blueprint)()`.
   Adding a static `register()` duplicates the entry point.
2. **`register()` collides with `ServiceProvider::register()`.** Two different
   concepts with the same name creates review-time confusion and IDE ambiguity.
3. **Instance invocation matches the rest of the codebase.** Actions invoke as
   `($action)($data)`. Single-action controllers invoke as `($controller)()`.
   Jobs are invokable. Consistency > novelty.

If a test needs to run the macro registration outside the discovery pipeline,
instantiate + invoke inline:

```php
(new UuidableBlueprint)();
```

Two lines, no static state, no discovery-pipeline dependency.

## The attribute

```php
namespace Academorix\Database\Attributes;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsDatabaseBlueprint
{
    public function __construct(
        public bool $enabled = true,
    ) {}
}
```

Non-negotiable:

- **Only `TARGET_CLASS`.** Never on methods or properties.
- **No `priority`.** Macros register at boot; order between macros is irrelevant
  because each blueprint owns a distinct macro name.
- **`enabled` flag** — set `false` to disable a blueprint without deleting the
  class (feature-flag a macro family). Discovery skips disabled blueprints.
  Delete the class when the disablement is permanent.

## Discovery

Discovery uses the shared `DiscoversAttributes` seam — never
`olvlvl\ComposerAttributeCollector\Attributes` directly:

```php
final class BlueprintBootstrapper extends AbstractBootstrapper
{
    public function __construct(
        private readonly DiscoversAttributes $discovery,
        private readonly Container $container,
        #[Log] private readonly LoggerInterface $log,
    ) {}

    public function name(): string
    {
        return 'database.blueprints';
    }

    public function priority(): int
    {
        return 40; // framework primitives — runs before domain modules
    }

    public function populate(): void
    {
        $registered = 0;

        foreach ($this->discovery->forClass(AsDatabaseBlueprint::class) as $target) {
            if ($target->attribute->enabled === false) {
                continue;
            }

            try {
                $blueprint = $this->container->make($target->className);
            } catch (\Throwable $e) {
                $this->log->warning('blueprint discovery: unresolvable class', [
                    'class' => $target->className,
                    'error' => $e->getMessage(),
                ]);
                continue;
            }

            if (! \is_callable($blueprint)) {
                $this->log->warning('blueprint discovery: class is not invokable', [
                    'class' => $target->className,
                ]);
                continue;
            }

            try {
                $blueprint();
                $registered++;
            } catch (\Throwable $e) {
                $this->log->warning('blueprint registration failed', [
                    'class' => $target->className,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->log->info('blueprint discovery complete', ['count' => $registered]);
    }
}
```

`Blueprint::macro()` is called once per macro family, once per worker boot.
Under Octane the macros persist for the process lifetime — no re-registration
per request.

## Naming conventions

- Blueprint class name is `<Concept>Blueprint` (`UuidableBlueprint`,
  `UserstampsBlueprint`).
- The MACRO name matches the concept, camelCase, on `Blueprint`:
  `->uuidPrimary()`, `->userstamps()`, `->prefixedUlid('xxx_')`,
  `->softDeletesTz()`.
- Never name a macro after the blueprint class (`uuidableBlueprint()`) — name it
  for what it DOES to the column list.

## Testing

Each blueprint gets ONE unit test that:

1. Invokes the blueprint.
2. Asserts the macro is registered on `Blueprint`.
3. Optionally exercises the macro against an in-memory table builder.

```php
it('registers the uuidPrimary macro on Blueprint', function (): void {
    (new UuidableBlueprint)();

    expect(Blueprint::hasMacro('uuidPrimary'))->toBeTrue();
});

it('lays down a uuid primary column via the macro', function (): void {
    (new UuidableBlueprint)();

    Schema::create('probe', function (Blueprint $table): void {
        $table->uuidPrimary();
    });

    expect(Schema::hasColumn('probe', 'id'))->toBeTrue();
    // Additional dialect-specific assertions on the column shape.
});
```

Discovery + hydration is tested at the bootstrapper level with an
`InMemoryDiscoversAttributes` fake (see `.kiro/steering/discovery.md` §Test
doubles).

## Anti-patterns

| Anti-pattern                                                                            | Correct                                                                                                                                                             |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public static function register(): void` on a blueprint                                | Delete. Keep instance `__invoke()` only (ADR-0007).                                                                                                                 |
| Both `register()` AND `__invoke()` on a blueprint                                       | Delete `register()`. `__invoke()` is the single entry point.                                                                                                        |
| Calling `UuidableBlueprint::register()` from a test                                     | `(new UuidableBlueprint)();` — instantiate + invoke.                                                                                                                |
| `resolve()` / `bootMacros()` / `apply()` as the entry point                             | Rename to `__invoke()`. Every blueprint uses the same method name.                                                                                                  |
| `#[AsDatabaseBlueprint]` on a method                                                    | Class-level target only.                                                                                                                                            |
| Blueprint that registers TWO macros (`uuidPrimary` + `ulidPrimary`) in one `__invoke()` | Split into two blueprints. One class, one macro family.                                                                                                             |
| Blueprint extending another blueprint                                                   | Blueprints are `final`. Compose via a shared trait if truly needed — but the pattern rarely appears.                                                                |
| Blueprint depending on domain packages                                                  | Blueprints live in `packages/framework/database/` and depend on Laravel + PHP only. Domain-specific column shapes belong on model attributes, not blueprint macros. |
| Manual `Blueprint::macro(...)` calls inside a `ServiceProvider::boot()`                 | Extract to a blueprint class. Boot-time `Blueprint::macro()` calls not attached to a `#[AsDatabaseBlueprint]` class are drift.                                      |
| Blueprint class without `@category Database` + `@since` tags                            | Framework packages carry Magento-style tags — add them.                                                                                                             |

## Related steering + ADRs

- [ADR-0007](../../docs/adr/0007-blueprint-invoke-vs-register.md) — the decision
  this steering codifies.
- `.kiro/steering/discovery.md` — the shared `DiscoversAttributes` seam the
  blueprint bootstrapper uses.
- `.kiro/steering/bootstrappers.md` — the `AbstractBootstrapper` contract the
  blueprint bootstrapper extends.
- `.kiro/steering/php-attributes.md` §Custom attributes — where
  `#[AsDatabaseBlueprint]` sits in the broader attribute catalogue.
- `.kiro/steering/docblocks.md` §Attributes — the docblock shape every blueprint
  class carries.
