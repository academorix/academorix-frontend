<?php

/**
 * @file packages/architecture/src/Support/PropertyDeclaration.php
 *
 * @description
 * Immutable value object capturing a single property declaration
 * from a class body. Populated by
 * {@see SourceFileParser::extractProperties()}; consumed by rules
 * that inspect the class's data surface (e.g. the Octane-safety
 * rule that forbids writable static state on Services).
 *
 * ## What's captured
 *
 *   - Visibility keyword (`public` / `protected` / `private`).
 *   - `static` flag.
 *   - `readonly` flag (PHP 8.1+).
 *   - Property name (no `$` sigil).
 *   - Line number.
 *
 * ## What's NOT captured
 *
 *   - Type declaration — not needed for the architectural rules
 *     we ship today. Add it here if a future rule requires it.
 *   - Default value — same rationale.
 *
 * Both are trivially recoverable from the raw file content if a
 * rule needs them; the parser skips them to keep the extraction
 * cost low.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Support;

/**
 * Immutable snapshot of one property declaration.
 *
 * @final
 */
final class PropertyDeclaration
{
    /**
     * @param  string  $name        Property name, WITHOUT the `$` sigil.
     * @param  string  $visibility  One of `public` / `protected` /
     *                              `private`. Constructor promoted
     *                              properties come through with the
     *                              visibility keyword from the
     *                              constructor signature.
     * @param  bool    $isStatic    `true` when the declaration used the
     *                              `static` keyword.
     * @param  bool    $isReadonly  `true` when the declaration used the
     *                              `readonly` keyword.
     * @param  bool    $isPromoted  `true` for constructor-promoted
     *                              properties (originating from the
     *                              `__construct` signature). Rules
     *                              that only care about class-body
     *                              properties filter on this flag.
     * @param  int     $line        1-indexed line number in the source.
     */
    public function __construct(
        public readonly string $name,
        public readonly string $visibility,
        public readonly bool $isStatic,
        public readonly bool $isReadonly,
        public readonly bool $isPromoted,
        public readonly int $line,
    ) {
    }
}
