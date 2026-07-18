<?php

/**
 * @file packages/foundation/src/Discovery/AttributeDiscovery.php
 *
 * @description
 * Production implementation of {@see DiscoversAttributes}. Delegates
 * to `olvlvl/composer-attribute-collector`'s static entry points and
 * normalises the returned anonymous-object shapes into our typed
 * {@see ClassTarget} / {@see MethodTarget} / {@see PropertyTarget} /
 * {@see ParameterTarget} value objects.
 *
 * ## Why the wrapper layer
 *
 * The static API is fine for a one-off script but painful when
 * every package needs to test its discovery logic:
 *
 *   - Static-method calls can't be stubbed without heavy tooling
 *     (Mockery::mockAlias hackery is fragile).
 *   - The anonymous-object return shape varies per target kind.
 *   - Every consumer would duplicate the "wrap raw hits in typed
 *     objects" translation code.
 *
 * This class owns that translation once. Consumers depend on
 * {@see DiscoversAttributes}; tests bind a fake implementation with
 * predictable, hand-built target lists.
 *
 * ## Manifest availability
 *
 * `olvlvl/composer-attribute-collector` writes
 * `vendor/attributes.php` at `composer dump-autoload` time. When
 * the manifest hasn't been written yet (fresh clone before any
 * composer command, or a slim test harness with vendor stripped
 * down), calls to `Attributes::findTarget*()` throw. This class
 * catches those failures and returns an empty iterable — the
 * consumer sees "no hits" instead of a crashing boot.
 *
 * ## Octane safety
 *
 * The manifest is a static array in `vendor/attributes.php`.
 * Reading it is O(1) and side-effect-free. This class is stateless
 * — safe to bind as a singleton.
 *
 * @see DiscoversAttributes                                  Contract.
 * @see \olvlvl\ComposerAttributeCollector\Attributes        Backend.
 */

declare(strict_types=1);

namespace Academorix\Foundation\Discovery;

use Academorix\Foundation\Contracts\DiscoversAttributes;
use olvlvl\ComposerAttributeCollector\Attributes;
use Throwable;

/**
 * Compile-time attribute discovery via
 * `olvlvl/composer-attribute-collector`.
 *
 * @final
 */
final class AttributeDiscovery implements DiscoversAttributes
{
    /**
     * @template T of object
     *
     * @param  class-string<T>  $attributeClass
     * @return iterable<ClassTarget<T>>
     */
    public function forClass(string $attributeClass): iterable
    {
        foreach ($this->collect(fn () => Attributes::findTargetClasses($attributeClass)) as $target) {
            // olvlvl's class-target shape:
            //   object { name: class-string, attribute: T }
            /** @var T $attribute */
            $attribute = $target->attribute;

            yield new ClassTarget(
                className: $target->name,
                attribute: $attribute,
            );
        }
    }

    /**
     * @template T of object
     *
     * @param  class-string<T>  $attributeClass
     * @return iterable<MethodTarget<T>>
     */
    public function forMethod(string $attributeClass): iterable
    {
        foreach ($this->collect(fn () => Attributes::findTargetMethods($attributeClass)) as $target) {
            // olvlvl's method-target shape:
            //   object { class: class-string, name: string (method), attribute: T }
            /** @var T $attribute */
            $attribute = $target->attribute;

            yield new MethodTarget(
                className: $target->class,
                methodName: $target->name,
                attribute: $attribute,
            );
        }
    }

    /**
     * @template T of object
     *
     * @param  class-string<T>  $attributeClass
     * @return iterable<PropertyTarget<T>>
     */
    public function forProperty(string $attributeClass): iterable
    {
        foreach ($this->collect(fn () => Attributes::findTargetProperties($attributeClass)) as $target) {
            // olvlvl's property-target shape:
            //   object { class: class-string, name: string (property), attribute: T }
            /** @var T $attribute */
            $attribute = $target->attribute;

            yield new PropertyTarget(
                className: $target->class,
                propertyName: $target->name,
                attribute: $attribute,
            );
        }
    }

    /**
     * @template T of object
     *
     * @param  class-string<T>  $attributeClass
     * @return iterable<ParameterTarget<T>>
     */
    public function forParameter(string $attributeClass): iterable
    {
        foreach ($this->collect(fn () => Attributes::findTargetParameters($attributeClass)) as $target) {
            // olvlvl's parameter-target shape:
            //   object { class: class-string, method: string, name: string (param), attribute: T }
            /** @var T $attribute */
            $attribute = $target->attribute;

            yield new ParameterTarget(
                className: $target->class,
                methodName: $target->method,
                parameterName: $target->name,
                attribute: $attribute,
            );
        }
    }

    /**
     * Safely invoke an olvlvl static call. Returns `[]` when the
     * manifest is unavailable (fresh clone, slim test harness, etc.)
     * so callers see "no hits" instead of a fatal.
     *
     * @template T
     *
     * @param  \Closure(): iterable<T>  $call
     * @return iterable<T>
     */
    private function collect(\Closure $call): iterable
    {
        // `class_exists()` on the olvlvl runtime facade — when the
        // package is missing from composer's autoload map (slim
        // test harness that stripped dev deps, for example) the
        // static call would fatal. Guard first.
        if (! class_exists(Attributes::class)) {
            return [];
        }

        try {
            $result = $call();
        } catch (Throwable) {
            // The manifest hasn't been written yet. This is a
            // legitimate state during first-boot after a fresh
            // clone — return empty and let the caller move on.
            return [];
        }

        return $result;
    }
}
