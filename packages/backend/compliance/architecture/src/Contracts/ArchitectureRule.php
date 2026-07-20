<?php

/**
 * @file packages/architecture/src/Contracts/ArchitectureRule.php
 *
 * @description
 * Contract every architectural rule implements. Rules receive a
 * parsed {@see \Academorix\Architecture\Support\SourceFile} and
 * return a list of {@see \Academorix\Architecture\Violations\Violation}
 * — never mutate the source file, never touch the filesystem,
 * never fetch remote resources.
 *
 * ## Contract guarantees
 *
 *   - **Idempotent** — running a rule twice on the same input
 *     yields identical output. No accumulated state on the
 *     instance.
 *
 *   - **Deterministic** — no time, no random, no network.
 *
 *   - **Fast** — the scanner iterates hundreds of files;
 *     per-rule cost matters. Prefer string / array operations
 *     over reflection or AST parsing when the check allows.
 *
 * ## Adding a new rule
 *
 * 1. Extend {@see \Academorix\Architecture\Rules\AbstractRule}
 *    (which handles the `id()` / `severity()` boilerplate).
 * 2. Implement `check(SourceFile $file): array<Violation>`.
 * 3. Register the rule in
 *    {@see \Academorix\Architecture\Providers\ArchitectureServiceProvider}'s
 *    tagged binding.
 * 4. Add a config toggle under `architecture.rules.<rule_id>`.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Contracts;

use Academorix\Architecture\Support\SourceFile;
use Academorix\Architecture\Violations\Violation;

/**
 * Every architectural rule implements this shape.
 */
interface ArchitectureRule
{
    /**
     * Stable, dotted identifier — e.g.
     * `architecture.no_direct_model_access`. Used as the rule's
     * config key, appears in violation payloads, and is what
     * developers grep for when investigating a failure.
     *
     * MUST NOT change once a rule ships — treat as public API.
     */
    public function id(): string;

    /**
     * Short one-line description of what the rule enforces.
     * Emitted verbatim by the reporter above each violation
     * group so developers see the "why" without diving into
     * source.
     */
    public function description(): string;

    /**
     * Inspect the parsed source file and return every violation
     * found. Return `[]` when the file passes cleanly.
     *
     * @return list<Violation>
     */
    public function check(SourceFile $file): array;
}
