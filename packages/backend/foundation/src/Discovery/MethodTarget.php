<?php

/**
 * @file packages/foundation/src/Discovery/MethodTarget.php
 *
 * @description
 * Immutable value object representing one "method carries attribute X"
 * hit produced by {@see AttributeDiscovery::forMethod()}.
 *
 * Same rationale as {@see ClassTarget} — see that file's docblock.
 *
 * @see \Stackra\Foundation\Discovery\AttributeDiscovery Producer.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Discovery;

/**
 * One "method carries attribute" hit.
 *
 * @template T of object
 *
 * @final
 */
final class MethodTarget
{
    /**
     * @param  class-string  $className   FQCN of the declaring class.
     * @param  string        $methodName  Name of the method carrying the attribute.
     * @param  T             $attribute   The attribute instance, materialised
     *                                    by olvlvl at compose dump-autoload time.
     */
    public function __construct(
        public readonly string $className,
        public readonly string $methodName,
        public readonly object $attribute,
    ) {
    }
}
