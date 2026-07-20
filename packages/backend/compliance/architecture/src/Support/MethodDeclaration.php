<?php

/**
 * @file packages/architecture/src/Support/MethodDeclaration.php
 *
 * @description
 * Immutable value object capturing a single method declaration from
 * a class body. Populated by {@see SourceFileParser::extractMethods()};
 * consumed by rules that check the class's method surface (e.g. the
 * job-must-have-failed-method rule, or the migration-must-have-down
 * rule).
 *
 * ## What's captured
 *
 *   - Visibility (`public` / `protected` / `private`).
 *   - Modifier flags (`static`, `final`, `abstract`).
 *   - Method name.
 *   - Line number.
 *
 * ## What's NOT captured
 *
 *   - Method body content. Rules that need body-level checks
 *     search the file's `strippedContent` globally instead — the
 *     rules we ship don't need per-method scope.
 *   - Return type / parameter list — again, not required today.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Support;

/**
 * Immutable snapshot of one method declaration.
 *
 * @final
 */
final class MethodDeclaration
{
    /**
     * @param  string  $name        Method name (case-sensitive as declared).
     * @param  string  $visibility  `public` / `protected` / `private`.
     *                              Defaulted to `public` when the source
     *                              omitted the keyword (PHP's default).
     * @param  bool    $isStatic    `true` when the declaration used the
     *                              `static` keyword.
     * @param  bool    $isFinal     `true` when the declaration used the
     *                              `final` keyword.
     * @param  bool    $isAbstract  `true` when the declaration used the
     *                              `abstract` keyword.
     * @param  int     $line        1-indexed line number in the source.
     */
    public function __construct(
        public readonly string $name,
        public readonly string $visibility,
        public readonly bool $isStatic,
        public readonly bool $isFinal,
        public readonly bool $isAbstract,
        public readonly int $line,
    ) {
    }
}
