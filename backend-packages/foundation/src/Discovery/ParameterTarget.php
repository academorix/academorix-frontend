<?php

/**
 * @file packages/foundation/src/Discovery/ParameterTarget.php
 *
 * @description
 * Immutable value object representing one "parameter carries attribute X"
 * hit produced by {@see AttributeDiscovery::forParameter()}.
 *
 * Same rationale as {@see ClassTarget} — see that file's docblock.
 *
 * @see \Academorix\Foundation\Discovery\AttributeDiscovery Producer.
 */

declare(strict_types=1);

namespace Academorix\Foundation\Discovery;

/**
 * One "parameter carries attribute" hit.
 *
 * @template T of object
 *
 * @final
 */
final class ParameterTarget
{
    /**
     * @param  class-string  $className      FQCN of the declaring class.
     * @param  string        $methodName     Name of the method that owns the parameter.
     * @param  string        $parameterName  Name of the parameter (WITHOUT the `$` sigil).
     * @param  T             $attribute      The attribute instance.
     */
    public function __construct(
        public readonly string $className,
        public readonly string $methodName,
        public readonly string $parameterName,
        public readonly object $attribute,
    ) {
    }
}
