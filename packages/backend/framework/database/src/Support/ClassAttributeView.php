<?php

/**
 * @file packages/database/src/Support/ClassAttributeView.php
 *
 * @description
 * Immutable value object exposing the class-level attribute list
 * of a target class in the same shape the old
 * `Pixielity\Discovery\Facades\Discovery::forClass()` reader
 * returned. Used exclusively by {@see AttributeReader} — see that
 * class docblock for the compatibility rationale.
 */

declare(strict_types=1);

namespace Stackra\Database\Support;

/**
 * Lightweight view of a target class's class-level attributes.
 *
 * Only the `classAttributes` field is exposed because that's the
 * ONLY field the old Pixielity `ClassContext` field the Model
 * concern traits consume. Method + property attributes are read
 * elsewhere via native PHP reflection.
 */
final readonly class ClassAttributeView
{
    /**
     * @param  list<object>  $classAttributes  Materialised
     *   attribute instances declared on the target class body.
     *   Every entry is already a `newInstance()`-ed object; the
     *   consumer can `instanceof` against its concrete attribute
     *   class without touching PHP reflection.
     */
    public function __construct(
        public array $classAttributes,
    ) {
    }
}
