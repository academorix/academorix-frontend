<?php

/**
 * @file packages/compliance/retention/src/Support/RetentionPolicyDescriptor.php
 *
 * @description
 * Immutable value object emitted by
 * {@see \Stackra\Retention\Bootstrappers\RetentionPolicyBootstrapper}
 * for every discovered `#[AsRetentionPolicy]` marker.
 *
 * The descriptor collapses the discovery-time knowledge into a
 * runtime-friendly shape:
 *
 *   - The attribute's `key`, `label`, `description` for logs and
 *     admin surfaces.
 *   - The concrete Eloquent model class-string the runner will
 *     query.
 *   - The `retentionDays` threshold + `dateColumn` name the
 *     runner uses to build the WHERE clause.
 *   - The {@see \Stackra\Retention\Enums\RetentionAction} enum
 *     case the runner branches on.
 *
 * Descriptors are `final readonly` — safe to share across a
 * request's lifetime. The registry holds a single descriptor per
 * `key`; duplicate keys throw at boot for diagnostics.
 *
 * @see \Stackra\Retention\Registry\RetentionPolicyRegistry Storage.
 * @see \Stackra\Retention\Runner\RetentionRunner Consumer.
 */

declare(strict_types=1);

namespace Stackra\Retention\Support;

use Stackra\Retention\Enums\RetentionAction;

/**
 * A single retention policy resolved from `#[AsRetentionPolicy]`.
 *
 * @category Retention
 *
 * @since    0.1.0
 */
final readonly class RetentionPolicyDescriptor
{
    /**
     * @param  string  $key
     *                       Stable machine identifier (e.g. `ai.run`). Doubles
     *                       as the registry key.
     * @param  string  $label
     *                         Human-readable label for admin surfaces.
     * @param  string  $description
     *                               Prose rationale, surfaced next to the label.
     * @param  class-string  $modelClass
     *                                    Fully-qualified Eloquent model class-string. The
     *                                    runner queries `$modelClass::query()->where(...)`
     *                                    to build the retention filter.
     * @param  int  $retentionDays
     *                              Age threshold in days. The runner computes
     *                              `now() - retentionDays` at execution time and
     *                              filters rows where `$dateColumn < cutoff`.
     * @param  RetentionAction  $action
     *                                   Retention action — delete / archive / anonymize.
     * @param  string  $dateColumn
     *                              Column name the runner compares against the cutoff.
     */
    public function __construct(
        public string $key,
        public string $label,
        public string $description,
        public string $modelClass,
        public int $retentionDays,
        public RetentionAction $action,
        public string $dateColumn,
    ) {}
}
