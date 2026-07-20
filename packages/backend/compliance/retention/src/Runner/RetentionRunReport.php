<?php

/**
 * @file packages/compliance/retention/src/Runner/RetentionRunReport.php
 *
 * @description
 * Immutable per-run outcome captured by
 * {@see \Academorix\Retention\Runner\RetentionRunner}. Consumed by
 * {@see \Academorix\Retention\Console\RunRetentionCommand} to
 * render one output row per executed policy, and by future
 * observability surfaces (admin dashboard, per-run audit trail)
 * that need a stable shape for retention outcomes.
 *
 * Recorded fields are chosen to answer the operator questions
 * every retention run raises:
 *
 *   - Which policy ran? (`key`, `modelClass`, `action`)
 *   - How much data did it touch? (`rowsAffected`)
 *   - How long did it take? (`durationMs`)
 *   - Was this a preview or a real run? (`dryRun`)
 *   - Did anything go wrong? (`errorMessage`)
 */

declare(strict_types=1);

namespace Academorix\Retention\Runner;

use Academorix\Retention\Enums\RetentionAction;

/**
 * Immutable outcome of a single retention policy run.
 *
 * ## What this class owns
 *
 *  * `key` — the descriptor's identifier — echo'd for correlation.
 *  * `modelClass` — the class-string the runner queried.
 *  * `action` — the branch the runner took (delete / archive /
 *    anonymize).
 *  * `rowsAffected` — count of rows touched by the action; 0 for
 *    dry-run counts against zero-match filters, 0 for
 *    unimplemented actions (archive / anonymize in v1).
 *  * `durationMs` — wall-clock milliseconds spent inside
 *    {@see RetentionRunner::run()}.
 *  * `dryRun` — echo of the runner's dry-run flag.
 *  * `errorMessage` — populated when the run threw internally or
 *    the branch is deferred (archive / anonymize) — surfaces on
 *    the command's per-row output so operators see the
 *    deferred-behaviour reason.
 *
 * @category Retention
 *
 * @since    0.1.0
 */
final readonly class RetentionRunReport
{
    /**
     * @param  string  $key  Descriptor identifier (e.g. `ai.run`).
     * @param  class-string  $modelClass  The Eloquent model class the runner queried.
     * @param  RetentionAction  $action  The action branch the runner took.
     * @param  int  $rowsAffected
     *                             Number of rows the action touched. On dry-run,
     *                             the count of rows the WHERE clause matched
     *                             (a preview of what would be deleted). Zero
     *                             for the deferred `Archive` / `Anonymize`
     *                             branches — the row count is meaningless when
     *                             the transform isn't implemented yet.
     * @param  int  $durationMs  Wall-clock milliseconds spent inside the runner.
     * @param  bool  $dryRun  Echo of the runner's dry-run flag.
     * @param  string|null  $errorMessage
     *                                     Non-null when either:
     *                                     - the runner caught an exception during the
     *                                     action (message + class in the string), OR
     *                                     - the branch is a deferred no-op (v1 archive /
     *                                     anonymize) — the string names the TODO
     *                                     marker so operators know which follow-up
     *                                     work unblocks it.
     */
    public function __construct(
        public string $key,
        public string $modelClass,
        public RetentionAction $action,
        public int $rowsAffected,
        public int $durationMs,
        public bool $dryRun,
        public ?string $errorMessage = null,
    ) {}
}
