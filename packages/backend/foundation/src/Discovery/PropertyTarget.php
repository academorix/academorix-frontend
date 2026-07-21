<?php

/**
 * @file packages/foundation/src/Discovery/PropertyTarget.php
 *
 * @description
 * Immutable value object representing one "property carries attribute X"
 * hit produced by {@see AttributeDiscovery::forProperty()}.
 *
 * Same rationale as {@see ClassTarget} — see that file's docblock.
 *
 * @see \Stackra\Foundation\Discovery\AttributeDiscovery Producer.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Discovery;

/**
 * One "property carries attribute" hit.
 *
 * @template T of object
 *
 * @final
 */
final class PropertyTarget
{
    /**
     * @param  class-string  $className     FQCN of the declaring class.
     * @param  string        $propertyName  Name of the property (WITHOUT the `$` sigil).
     * @param  T             $attribute     The attribute instance.
     */
    public function __construct(
        public readonly string $className,
        public readonly string $propertyName,
        public readonly object $attribute,
    ) {
    }
}
