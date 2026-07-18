<?php

declare(strict_types=1);

/**
 * @file packages/framework/container/src/Attributes/Overrides.php
 *
 * @description
 * Class-level attribute that binds THIS concrete class as the resolution
 * for another abstract in the DI container. The "flipped" counterpart to
 * Laravel's canonical {@see \Illuminate\Container\Attributes\Bind} — kept
 * in the Academorix framework specifically for the case Laravel's
 * canonical shape cannot express:
 *
 *   > **The abstract is a class we do not control** (typically a vendor
 *   > class, occasionally a third-party interface). Laravel's `#[Bind]`
 *   > goes ON the abstract with the concrete as its argument, so it
 *   > requires ownership of the abstract's source. `#[Overrides]` goes
 *   > ON the concrete with the abstract as its argument — a subclass /
 *   > implementer can declare its container-substitution intent without
 *   > touching (or being able to touch) the vendor source.
 *
 * ## Pattern A vs Pattern B — the split codified in
 * `.kiro/steering/php-attributes.md`
 *
 * ```
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Pattern A — Laravel canonical                                 │
 * │  #[Illuminate\Container\Attributes\Bind(Concrete::class)]      │
 * │  interface XInterface { ... }                                  │
 * │                                                                │
 * │  Attribute lives on the ABSTRACT (we own it).                  │
 * │  Arg = CONCRETE.                                               │
 * │  Registers `bind(XInterface, Concrete)`.                       │
 * │  Use this whenever we own both sides.                          │
 * └────────────────────────────────────────────────────────────────┘
 *
 * ┌────────────────────────────────────────────────────────────────┐
 * │  Pattern B — Academorix override                               │
 * │  #[Academorix\Container\Attributes\Overrides(Vendor::class)]   │
 * │  class MyConcrete extends Vendor { ... }                       │
 * │                                                                │
 * │  Attribute lives on the CONCRETE (we own it).                  │
 * │  Arg = ABSTRACT (we typically don't).                          │
 * │  Registers `bind(Vendor, MyConcrete)`.                         │
 * │  Use this when the abstract is a vendor class or a third-      │
 * │  party interface we cannot annotate.                           │
 * └────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Semantics
 *
 * The container's discovery loop (see
 * {@see \Academorix\Container\Concerns\HasDiscovery::discoverOverriddenClasses()})
 * scans every class carrying this attribute and registers
 * `$app->bind($attribute->abstract, $carrierClass)`. The carrier's
 * lifetime is honoured — `#[Singleton]` promotes the binding to
 * `$app->singleton(...)`, `#[Scoped]` to `$app->scoped(...)`.
 * Environment filtering (`environments: ['prod']`) is honoured too.
 *
 * ## Canonical example
 *
 * ```php
 * use Academorix\Container\Attributes\Overrides;
 * use Spatie\RouteAttributes\RouteRegistrar as SpatieRouteRegistrar;
 *
 * #[Overrides(SpatieRouteRegistrar::class)]
 * class RouteRegistrar extends SpatieRouteRegistrar
 * {
 *     // Our implementation overrides Spatie's in the container.
 *     // Any consumer that type-hints `SpatieRouteRegistrar` now
 *     // receives our subclass instead.
 * }
 * ```
 *
 * ## When NOT to use `#[Overrides]`
 *
 *   - The abstract is an interface we OWN. Use Laravel's canonical
 *     `#[Bind(Concrete::class)]` on the interface itself — Pattern A.
 *   - There's no interface / abstract — just a service being registered.
 *     Use `#[Singleton]` or `#[Scoped]` alone; no binding attribute needed.
 *   - The substitution is per-environment and env-config-driven at
 *     runtime rather than compile-time attribute-visible. Use imperative
 *     `$this->app->bind(...)` inside the provider's `register()`.
 *
 * @see \Academorix\Container\Concerns\HasDiscovery::discoverOverriddenClasses()  Discovery consumer.
 * @see \Illuminate\Container\Attributes\Bind Canonical Laravel counterpart (Pattern A).
 *
 * @category Attributes
 *
 * @since    1.0.0
 */

namespace Academorix\Container\Attributes;

use Attribute;
use BackedEnum;
use InvalidArgumentException;
use UnitEnum;

/**
 * Marker attribute that overrides a container binding by placing the
 * declaration on the CONCRETE (Pattern B — see file docblock for the
 * split against Laravel's canonical `#[Bind]`).
 *
 * `IS_REPEATABLE` because a single concrete can substitute for more
 * than one abstract (e.g. a class that implements two interfaces and
 * wants to be the container-resolved concrete for both).
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final class Overrides
{
    /**
     * Environments the override applies to. Normalised to a list of
     * scalar strings at construction.
     *
     * @var non-empty-array<int, string>
     */
    public array $environments;

    /**
     * @param  class-string  $abstract
     *   The abstract this concrete replaces in the container. May be an
     *   interface, an abstract class, or a concrete third-party class
     *   whose behaviour we're substituting.
     * @param  non-empty-array<int, BackedEnum|UnitEnum|non-empty-string>|non-empty-string|UnitEnum  $environments
     *   Environments the override applies to. Defaults to `['*']` (all
     *   environments). Enum values are normalised to their `->value`;
     *   pure enums normalise to `->name`.
     *
     * @throws InvalidArgumentException  When `$environments` is empty.
     */
    public function __construct(
        /**
         * The abstract interface or class this concrete overrides in
         * the container. Read by the discovery loop as the FIRST
         * argument to `$app->bind()`.
         */
        public string $abstract,
        string|array|UnitEnum $environments = ['*'],
    ) {
        $environments = array_filter(is_array($environments) ? $environments : [$environments]);

        if ($environments === []) {
            throw new InvalidArgumentException(
                'The environments property must be set and cannot be empty.',
            );
        }

        // Normalise every entry to a scalar string. BackedEnum → value;
        // UnitEnum → name; plain string passes through.
        $this->environments = array_map(
            static fn ($environment): int|string => match (true) {
                $environment instanceof BackedEnum => $environment->value,
                $environment instanceof UnitEnum   => $environment->name,
                default                            => $environment,
            },
            $environments,
        );
    }
}
