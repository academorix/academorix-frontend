<?php

/**
 * @file packages/foundation/src/Contracts/DiscoversAttributes.php
 *
 * @description
 * The compile-time attribute-discovery contract. Every package that
 * needs to find "which classes / methods / properties / parameters
 * carry attribute X?" resolves this interface from the container
 * and calls the appropriate `forX()` method.
 *
 * ## Why one contract for the whole monorepo
 *
 * Before this contract, discovery was fragmented:
 *
 *   - Events package used `olvlvl/composer-attribute-collector`
 *     directly via 4 constructor-injected closures.
 *   - Routing package used `pixielity/discovery` (a wrapper over
 *     olvlvl).
 *   - AI package used a custom filesystem walk + reflection.
 *   - Crud package used olvlvl directly across 4 different traits.
 *
 * One interface unifies all of that. Consumers depend on the
 * contract, tests bind an in-memory implementation, and the
 * production binding delegates to olvlvl. Deprecating olvlvl or
 * swapping it for a different backend becomes a one-line change
 * in the service provider.
 *
 * ## Return shape
 *
 * Every `for*()` method returns an `iterable` of typed target
 * objects — {@see \Stackra\Foundation\Discovery\ClassTarget},
 * {@see \Stackra\Foundation\Discovery\MethodTarget},
 * {@see \Stackra\Foundation\Discovery\PropertyTarget},
 * {@see \Stackra\Foundation\Discovery\ParameterTarget}. Callers
 * iterate lazily; there is no eager materialisation cost.
 *
 * @see \Stackra\Foundation\Discovery\AttributeDiscovery Production implementation.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Contracts;

use Stackra\Foundation\Discovery\ClassTarget;
use Stackra\Foundation\Discovery\MethodTarget;
use Stackra\Foundation\Discovery\ParameterTarget;
use Stackra\Foundation\Discovery\PropertyTarget;

/**
 * The uniform attribute-discovery API.
 */
interface DiscoversAttributes
{
    /**
     * Every class carrying `#[$attributeClass]`. When the attribute
     * is repeatable, each attribute instance yields its own target
     * (so one class can appear more than once).
     *
     * @template T of object
     *
     * @param  class-string<T>  $attributeClass
     * @return iterable<ClassTarget<T>>
     */
    public function forClass(string $attributeClass): iterable;

    /**
     * Every method carrying `#[$attributeClass]`. Repeatable
     * attributes yield one target per instance.
     *
     * @template T of object
     *
     * @param  class-string<T>  $attributeClass
     * @return iterable<MethodTarget<T>>
     */
    public function forMethod(string $attributeClass): iterable;

    /**
     * Every property carrying `#[$attributeClass]`. Repeatable
     * attributes yield one target per instance.
     *
     * @template T of object
     *
     * @param  class-string<T>  $attributeClass
     * @return iterable<PropertyTarget<T>>
     */
    public function forProperty(string $attributeClass): iterable;

    /**
     * Every parameter carrying `#[$attributeClass]`. Repeatable
     * attributes yield one target per instance.
     *
     * @template T of object
     *
     * @param  class-string<T>  $attributeClass
     * @return iterable<ParameterTarget<T>>
     */
    public function forParameter(string $attributeClass): iterable;
}
