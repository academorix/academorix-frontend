<?php

/**
 * @file packages/compliance/retention/src/Runner/RetentionRunner.php
 *
 * @description
 * Executes a single retention policy against its target model.
 *
 * The runner is the smallest testable unit of the retention
 * pipeline — one descriptor in, one report out. Both
 * {@see \Stackra\Retention\Console\RunRetentionCommand} (which
 * iterates every descriptor from the registry) and future
 * background workers (per-policy queue jobs) call this class the
 * same way: `$runner->run($descriptor, $dryRun)`.
 *
 * ## Failure isolation
 *
 * A retention run walks every registered policy. One broken
 * policy MUST NOT halt the batch — the runner wraps its body in
 * try/catch, records the throwable's class + message on the
 * report, and returns normally. The caller iterates every
 * descriptor and renders every report; operators see the failed
 * row on the summary without losing the successful ones.
 *
 * ## Timing
 *
 * `hrtime(true)` bracketed around the body — the resulting
 * `durationMs` is precise enough for scheduling visibility
 * (whether a policy blew its expected wall-clock budget) without
 * needing the profiler overhead of real percentiles.
 */

declare(strict_types=1);

namespace Stackra\Retention\Runner;

use Stackra\Foundation\Contracts\Clock;
use Stackra\Retention\Enums\RetentionAction;
use Stackra\Retention\Support\RetentionPolicyDescriptor;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Database\Eloquent\Model;
use Psr\Log\LoggerInterface;
use Throwable;

/**
 * Single-policy retention executor.
 *
 * ## What this class owns
 *
 *  * The action switch — one branch per {@see RetentionAction}
 *    case.
 *  * The retention-cutoff computation
 *    (`now() - retentionDays days`) via the injected {@see Clock}.
 *  * The dry-run substitution (`->count()` instead of `->delete()`)
 *    so operators can preview blast radius before flipping the
 *    switch.
 *  * The timing bracket + try/catch that guarantee every call
 *    returns a report (never a raw throw).
 *  * The two deferred-branch warnings that trip in v1 for
 *    `Archive` and `Anonymize` — LEGITIMATE deferrals gated by
 *    `TODO(retention-archive-storage)` and
 *    `TODO(retention-anonymize-pii)`.
 *
 * `#[Scoped]` — the runner holds per-request state during a
 * single execution (the injected clock is scoped in tests, the
 * logger is per-request). One instance per request lifetime.
 *
 * @category Retention
 *
 * @since    0.1.0
 */
#[Scoped]
final class RetentionRunner
{
    /**
     * @param  Clock  $clock  Testable "now" abstraction from `stackra/foundation`.
     * @param  LoggerInterface  $log  Log channel for deferred-branch warnings + exception context.
     */
    public function __construct(
        private readonly Clock $clock,
        #[Log] private readonly LoggerInterface $log,
    ) {}

    /**
     * Execute one retention policy.
     *
     * Always returns a report — a throw inside the action branch
     * is caught, logged, and echoed on the report's
     * `errorMessage` field so the batch caller can move on to the
     * next descriptor.
     *
     * @param  RetentionPolicyDescriptor  $descriptor  The policy to run.
     * @param  bool  $dryRun
     *                        When `true`, the runner replaces the destructive
     *                        `->delete()` with `->count()` and returns the
     *                        matching-row count under `rowsAffected` — a
     *                        preview of what a real run would touch. State-
     *                        changing branches (archive / anonymize) are
     *                        deferred regardless of the flag; the flag only
     *                        distinguishes preview-vs-execute on the
     *                        implemented `Delete` branch.
     */
    public function run(RetentionPolicyDescriptor $descriptor, bool $dryRun = false): RetentionRunReport
    {
        $startedAt = \hrtime(true);
        $rowsAffected = 0;
        $errorMessage = null;

        try {
            $rowsAffected = match ($descriptor->action) {
                RetentionAction::Delete => $this->runDelete($descriptor, $dryRun),
                RetentionAction::Archive => $this->runArchive($descriptor, $errorMessage),
                RetentionAction::Anonymize => $this->runAnonymize($descriptor, $errorMessage),
            };
        } catch (Throwable $e) {
            // Never bubble — one broken policy would halt the
            // batch and leave every downstream policy skipped for
            // the current window. Instead surface the throw on the
            // report and log at ERROR so the ops dashboard picks
            // it up.
            $this->log->error('Retention policy run failed.', [
                'key' => $descriptor->key,
                'model' => $descriptor->modelClass,
                'action' => $descriptor->action->value,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            $errorMessage = sprintf('%s: %s', $e::class, $e->getMessage());
            $rowsAffected = 0;
        }

        $durationMs = (int) \round((\hrtime(true) - $startedAt) / 1_000_000);

        return new RetentionRunReport(
            key: $descriptor->key,
            modelClass: $descriptor->modelClass,
            action: $descriptor->action,
            rowsAffected: $rowsAffected,
            durationMs: $durationMs,
            dryRun: $dryRun,
            errorMessage: $errorMessage,
        );
    }

    /**
     * `Delete` branch — hard-delete rows past the cutoff.
     *
     * On dry-run, substitutes `->count()` for `->delete()` so the
     * operator sees the exact blast radius without mutating any
     * state.
     *
     * @return int Row count — deleted rows on a real run, matching rows on a dry-run.
     */
    private function runDelete(RetentionPolicyDescriptor $descriptor, bool $dryRun): int
    {
        $cutoff = $this->clock->now()->subDays($descriptor->retentionDays);

        /** @var class-string<Model> $modelClass */
        $modelClass = $descriptor->modelClass;

        $query = $modelClass::query()
            ->where($descriptor->dateColumn, '<', $cutoff);

        if ($dryRun) {
            return (int) $query->count();
        }

        return (int) $query->delete();
    }

    /**
     * `Archive` branch — LEGITIMATE DEFERRAL.
     *
     * Emits a WARNING log entry that names the TODO marker
     * blocking implementation. The concrete archive-table layout
     * (schema, retention on the archive itself, downstream
     * reads) belongs to the owner package for each policy —
     * `ai_drafts` has different archive semantics than
     * `attendance_snapshots`.
     *
     * TODO(retention-archive-storage): specify the per-model
     * archive transform. Each `RetentionAction::Archive` model
     * needs an `AppliesArchive` implementer (or equivalent) that
     * the runner dispatches to; that contract lands in a later
     * commit. Until then this branch is a no-op that visibly
     * signals its status on the report.
     *
     * @param  string|null  $errorMessage  Set by the branch to the deferred-behaviour reason.
     * @return int Always 0 — no rows touched.
     */
    private function runArchive(RetentionPolicyDescriptor $descriptor, ?string &$errorMessage): int
    {
        $this->log->warning('Retention archive action is not yet implemented; skipping policy.', [
            'key' => $descriptor->key,
            'model' => $descriptor->modelClass,
            'todo' => 'TODO(retention-archive-storage)',
        ]);

        $errorMessage = 'archive action not yet implemented; TODO(retention-archive-storage)';

        return 0;
    }

    /**
     * `Anonymize` branch — LEGITIMATE DEFERRAL.
     *
     * Emits a WARNING log entry that names the TODO marker
     * blocking implementation. The concrete PII-column list
     * belongs to the owner package for each policy — a
     * medical-notes row has different PII than a payment-log
     * row.
     *
     * TODO(retention-anonymize-pii): specify the per-model
     * anonymize transform. Each `RetentionAction::Anonymize`
     * model needs a declaration of which columns to null / hash
     * and the null-safe fallbacks for downstream reads; that
     * contract lands in a later commit. Until then this branch
     * is a no-op that visibly signals its status on the report.
     *
     * @param  string|null  $errorMessage  Set by the branch to the deferred-behaviour reason.
     * @return int Always 0 — no rows touched.
     */
    private function runAnonymize(RetentionPolicyDescriptor $descriptor, ?string &$errorMessage): int
    {
        $this->log->warning('Retention anonymize action is not yet implemented; skipping policy.', [
            'key' => $descriptor->key,
            'model' => $descriptor->modelClass,
            'todo' => 'TODO(retention-anonymize-pii)',
        ]);

        $errorMessage = 'anonymize action not yet implemented; TODO(retention-anonymize-pii)';

        return 0;
    }
}
