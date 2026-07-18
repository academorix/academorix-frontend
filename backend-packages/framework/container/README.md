# academorix/container

> **Attribute-driven container binding for the Pattern-B case Laravel's
> canonical `#[Bind]` can't express.**

Every Academorix service that needs to swap an abstract for a concrete in the DI
container uses one of two attributes, picked by ownership of the abstract:

- **You own the abstract (interface / abstract class)?** →
  [`Illuminate\Container\Attributes\Bind`](https://laravel.com/docs/container).
  Placed ON the abstract; the argument is the concrete. Pattern A.
- **The abstract is vendor / third-party (or an interface you can't annotate)?**
  → `Academorix\Container\Attributes\Overrides` (this package). Placed ON the
  concrete; the argument is the abstract. Pattern B.

This package ships **only** the Pattern B side. Pattern A ships in Laravel.

Read [`.kiro/steering/php-attributes.md` § "Bind vs Overrides"][steering] for
the codified split; this README is the operator's guide.

[steering]: ../../../.kiro/steering/php-attributes.md

---

## Contents

- [What this package ships](#what-this-package-ships)
- [When to use `#[Overrides]`](#when-to-use-overrides)
- [Quick start](#quick-start)
- [Semantics](#semantics)
- [API reference](#api-reference)
- [Non-goals](#non-goals)

---

## What this package ships

Three artifacts. Nothing else.

| Artifact                                                  | Kind             | Purpose                                                                                    |
| --------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| `Academorix\Container\Attributes\Overrides`               | class attribute  | Marks a concrete class as the container resolution for another abstract.                   |
| `Academorix\Container\Concerns\HasDiscovery`              | trait            | Boot-time discovery pass that scans every `#[Overrides]` target and registers the binding. |
| `Academorix\Container\Providers\ContainerServiceProvider` | service provider | Composes `HasDiscovery` and invokes it during `register()`. Priority `1`.                  |

That's it. No custom `Bind` (we use Laravel's), no `#[Tagged]` (removed —
Laravel's `$app->tag()` + `#[Tag]` parameter attribute cover it canonically), no
runtime magic beyond the discovery loop.

---

## When to use `#[Overrides]`

Two overlapping rules — both must hold:

1. You want to replace a class in the container at DI resolution time.
2. The abstract being replaced is a class you **cannot** annotate — a vendor
   class in `vendor/`, a third-party interface, or a Laravel-internal class.

If both hold, this attribute is the right tool.

If you own the abstract, use Laravel's canonical `#[Bind]` on the abstract
instead — it's the more idiomatic direction and colocates the binding decision
with the contract.

### Real-world example — the routing package's use

```php
use Academorix\Container\Attributes\Overrides;
use Spatie\RouteAttributes\RouteRegistrar as SpatieRouteRegistrar;

#[Overrides(SpatieRouteRegistrar::class)]
class RouteRegistrar extends SpatieRouteRegistrar
{
    // Academorix's Discovery-based scanner replaces Spatie's
    // directory-based one. Anyone injecting `SpatieRouteRegistrar`
    // (including Spatie's own service provider) now receives our
    // subclass — without touching Spatie's source.
}
```

`SpatieRouteRegistrar` is a vendor class we cannot annotate with Laravel's
`#[Bind]`. `#[Overrides]` on our subclass gives us the same net effect
attribute-first, without an imperative `$this->app->bind(...)` in a service
provider.

---

## Quick start

### 1. Install (via the framework meta-package)

```bash
composer require academorix/framework
```

`academorix/container` ships as a dependency of `academorix/framework`. The
`ContainerServiceProvider` is auto-registered via Laravel's package discovery —
you don't need to add it to `bootstrap/providers.php`.

### 2. Add `#[Overrides]` to your concrete

```php
use Academorix\Container\Attributes\Overrides;
use Vendor\Package\OriginalClass;

#[Overrides(OriginalClass::class)]
class MyReplacement extends OriginalClass
{
    // ...
}
```

### 3. Rebuild the attribute cache

`#[Overrides]` is discovered via
[olvlvl/composer-attribute-collector](https://github.com/olvlvl/composer-attribute-collector),
which needs a cache rebuild after any class is added / renamed / removed:

```bash
composer dump-autoload
```

That's it. On the next boot, the `ContainerServiceProvider` calls
`discoverOverriddenClasses()` in its `register()` phase; every `#[Overrides]`
target is walked and its binding registered.

---

## Semantics

### Registration shape

Discovery calls one of:

- `$app->singleton($abstract, $concreteClass)` — when the concrete also carries
  `#[Illuminate\Container\Attributes\Singleton]`.
- `$app->scoped($abstract, $concreteClass)` — when the concrete carries
  `#[Illuminate\Container\Attributes\Scoped]`.
- `$app->bind($abstract, $concreteClass)` — default, transient.

Singleton wins over Scoped when both are present — same precedence Laravel
applies internally.

### Environment filtering

The attribute accepts an `environments` list identical to Laravel's `#[Bind]`
env argument. Skip registration when the current env isn't in the list:

```php
// Only registers in prod + staging; local dev keeps the vendor default.
#[Overrides(OriginalClass::class, environments: ['production', 'staging'])]
class MyProductionReplacement extends OriginalClass { }
```

The wildcard `'*'` (default) always registers.

### Repeatability

`#[Overrides]` is `IS_REPEATABLE` — a single concrete can substitute for more
than one abstract (e.g. a class that implements two interfaces and wants to be
the container-resolved concrete for both):

```php
#[Overrides(FirstAbstract::class)]
#[Overrides(SecondAbstract::class)]
class MyImplementation implements FirstAbstract, SecondAbstract { }
```

---

## API reference

### `#[Overrides(abstract, environments = ['*'])]`

Class-level attribute (`TARGET_CLASS`, `IS_REPEATABLE`).

| Parameter      | Type                                                | Default  | Description                                                                    |
| -------------- | --------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| `abstract`     | `class-string`                                      | required | The abstract this concrete replaces in the container.                          |
| `environments` | `string \| array<string \| UnitEnum \| BackedEnum>` | `['*']`  | App environments the binding applies to. `'*'` = every environment. Non-empty. |

### `HasDiscovery` trait

Composed by service providers that own container-override wiring. Exposes:

- `discoverOverriddenClasses(): void` — the discovery pass. Walks every
  `#[Overrides]` target, honours `#[Singleton]` / `#[Scoped]` lifetime markers +
  environment filter, and dispatches to `$this->app->bind()` / `singleton()` /
  `scoped()`.

Call from `register()` after `parent::register()`:

```php
use Academorix\Container\Concerns\HasDiscovery;
use Academorix\ServiceProvider\Providers\ServiceProvider;

class MyProvider extends ServiceProvider
{
    use HasDiscovery;

    public function register(): void
    {
        parent::register();
        $this->discoverOverriddenClasses();
    }
}
```

Under normal use you don't compose this trait in your own providers —
`ContainerServiceProvider` does it once for the whole app at priority `1`.

### `ContainerServiceProvider`

The root provider. Priority `1` — this MUST run first so any downstream
consumer's `register()` phase observes the override binding already registered.

Auto-discovered via Laravel's package-discovery. Nothing to configure.

---

## Non-goals

- **`#[Bind]` — Pattern A.** Use Laravel's
  `Illuminate\Container\Attributes\Bind`. If we need to swap Laravel's Bind for
  a compile-time variant later, that's a separate package.
- **`#[Tagged]` — container tagging via attribute.** Removed as YAGNI after zero
  real consumers. If we need it back, Laravel already ships `$app->tag(...)` +
  `#[Tag]` parameter attribute. A compile-time class- level tag attribute can be
  re-added when the first real consumer shows up.
- **Runtime container manipulation.** Discovery runs once per boot; no
  live-swap, no per-request rebind. If you need per-request scope, use
  `#[Scoped]` on the concrete.
- **Bindings that require closures / dynamic runtime state.** Those still belong
  in imperative `$this->app->bind($abstract, fn () => …)` blocks in your
  provider. `#[Overrides]` is compile-time metadata only.

---

## License

Part of the Academorix framework. See the repository root for licence terms.
