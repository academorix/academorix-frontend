<?php

/**
 * @file packages/architecture/src/Contracts/PathRule.php
 *
 * @description
 * Rule contract for filesystem-existence checks — rules that
 * enforce "file X must (not) exist" or "folder Y must (not) exist"
 * rather than inspecting PHP source. Runs against each configured
 * scan root ONCE per invocation, not per-file.
 *
 * ## Why a separate contract from {@see ArchitectureRule}
 *
 *   - Different input shape — a root path, not a parsed source
 *     file. Merging into `ArchitectureRule::check(SourceFile)`
 *     would force us to invent a "phantom SourceFile" for path
 *     checks or invert the loop awkwardly.
 *
 *   - Different iteration cost — path rules run once per root,
 *     not once per file. Keeping the contracts separate lets the
 *     scanner pick the right loop shape.
 *
 *   - Different tooling story — path rules run BEFORE the PHP
 *     scanner walk, so a "no `routes/api.php` may exist" rule
 *     fails fast without opening a single `.php` file.
 *
 * ## Contract guarantees
 *
 * Same as {@see ArchitectureRule}: idempotent, deterministic, and
 * side-effect free.
 *
 * @see \Stackra\Architecture\Rules\AbstractPathRule Base class.
 * @see ArchitectureRule                                Source-scan sibling contract.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Contracts;

use Stackra\Architecture\Violations\Violation;

/**
 * Every path-existence rule implements this shape.
 */
interface PathRule
{
    /**
     * Stable dotted identifier — same convention as
     * {@see ArchitectureRule::id()}.
     */
    public function id(): string;

    /**
     * One-line human-readable description.
     */
    public function description(): string;

    /**
     * Inspect the supplied scan root and return every violation
     * found. Return `[]` when nothing is wrong.
     *
     * @param  string  $root  Absolute path to the scan root (an
     *                        entry from `config('architecture.paths')`).
     *
     * @return list<Violation>
     */
    public function check(string $root): array;
}
