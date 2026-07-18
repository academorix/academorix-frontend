<?php

/**
 * @file packages/foundation/src/Discovery/ClassTarget.php
 *
 * @description
 * Immutable value object representing one "class carries attribute X"
 * hit produced by {@see AttributeDiscovery::forClass()}.
 *
 * ## Why a value object instead of olvlvl's raw shape
 *
 * `olvlvl/composer-attribute-collector` returns anonymous objects
 * whose exact shape varies by target kind (class / method / property
 * / parameter). Wrapping each shape in a named value object gives:
 *
 *   - **Type stability** — consumers depend on named classes, not
 *     `object{name: class-string, attribute: object}` structural
 *     types that PHPStan can't verify at consumer-site.
 *   - **Testability** — tests construct fixture hits via `new
 *     ClassTarget(...)` instead of hand-rolling anonymous objects
 *     that match olvlvl's shape.
 *   - **Refactor safety** — renaming an olvlvl field would break
 *     every consumer directly; here it only affects this file.
 *
 * @see \Academorix\Foundation\Discovery\AttributeDiscovery Producer.
 */

declare(strict_types=1);

namespace Academorix\Foundation\Discovery;

/**
 * One "class carries attribute" hit.
 *
 * @template T of object
 *
 * @final
 */
final class ClassTarget
{
    /**
     * @param  class-string  $className  FQCN of the class carrying the attribute.
     * @param  T             $attribute  The attribute instance, already
     *                                   materialised by olvlvl at
     *                                   `composer dump-autoload` time.
     */
    public function __construct(
        public readonly string $className,
        public readonly object $attribute,
    ) {
    }
}
