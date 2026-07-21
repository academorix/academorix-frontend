<?php

/**
 * @file packages/architecture/src/Support/InlineReference.php
 *
 * @description
 * Parsed representation of a fully-qualified class reference that
 * appears OUTSIDE `use` statements — e.g. inline usages like
 *
 *     \App\Models\User::query();
 *     new \App\Models\Invoice();
 *     public function foo(\App\Models\User $u): void { }
 *
 * Rules that only look at `use` statements would miss these; the
 * parser scans for fully-qualified names (any identifier starting
 * with a leading backslash and containing at least one namespace
 * separator) and records them here.
 *
 * ## Why we track the line
 *
 * Reporter output includes the offending line so developers can
 * jump straight to it. Without the line, "your controller imports
 * a model" is annoying to locate; with it, IDE integrations
 * click-through.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Support;

/**
 * Immutable value object — one per inline FQCN reference.
 *
 * @final
 */
final class InlineReference
{
    /**
     * @param  string  $fqcn  Fully qualified class name, normalised
     *                        WITHOUT a leading backslash so
     *                        comparisons with {@see UseStatement::$fqcn}
     *                        stay simple.
     * @param  int     $line  1-indexed line number where the
     *                        reference appears.
     */
    public function __construct(
        public readonly string $fqcn,
        public readonly int $line,
    ) {
    }

    /**
     * @param  list<string>  $prefixes  Namespace prefixes with trailing backslash.
     */
    public function isUnderAnyNamespace(array $prefixes): bool
    {
        foreach ($prefixes as $prefix) {
            if (str_starts_with($this->fqcn, $prefix)) {
                return true;
            }
        }

        return false;
    }
}
