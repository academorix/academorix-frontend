<?php

declare(strict_types=1);

namespace Stackra\Retention\Enums;

use Stackra\Enum\Enum;
use Stackra\Retention\Runner\RetentionRunner;

/**
 * The concrete action a retention policy takes on rows past their
 * age threshold.
 *
 * Persisted on `#[AsRetentionPolicy(action: ...)]` markers and
 * consumed by {@see RetentionRunner}
 * when it dispatches per-policy work.
 *
 * ## Cases
 *
 *  * {@see self::Delete}    — hard-delete rows. Fit for high-churn
 *    audit tables where downstream analytics have already been
 *    aggregated out.
 *  * {@see self::Archive}   — move rows to a cold-storage table
 *    before delete. Fit for user-authored content where a
 *    long-tail retrieval path remains valuable but the row
 *    should not occupy hot-path storage.
 *  * {@see self::Anonymize} — strip PII columns but keep the row
 *    for analytical purposes. Fit for behavioural data where the
 *    aggregate is the value and the actor identity is not.
 *
 * ## v1 status
 *
 * Only {@see self::Delete} ships with a working
 * implementation in v1. {@see self::Archive} and
 * {@see self::Anonymize} are legitimate deferrals — they require
 * per-model archive-table + PII-strip logic only the model owner
 * can specify. The runner logs a WARNING on those branches and
 * leaves the row untouched; markers on models declaring these
 * actions are safe to ship today but will only fire once the
 * owner package specifies the concrete transform (see
 * `TODO(retention-archive-storage)` and
 * `TODO(retention-anonymize-pii)`).
 *
 * @category Retention
 *
 * @since    0.1.0
 */
enum RetentionAction: string
{
    use Enum;

    /**
     * Hard-delete rows past the retention threshold.
     *
     * The runner issues `Model::query()->where($dateColumn, '<', $cutoff)->delete()`
     * and returns the affected row count. Suitable for high-churn
     * audit tables (`ai_runs`, `ai_tool_calls`) where 6-month
     * lookback covers every analytical query.
     */
    case Delete = 'delete';

    /**
     * Move rows to a cold-storage table before delete.
     *
     * v1 status: LEGITIMATE DEFERRAL. The runner logs a WARNING
     * and leaves rows untouched — the per-model archive-table
     * layout can only be authored by the owner package (a
     * different `ai_drafts_archive` schema than an
     * `attendance_archive` schema, and so on).
     * See `TODO(retention-archive-storage)`.
     */
    case Archive = 'archive';

    /**
     * Strip PII columns but keep the row for analytical purposes.
     *
     * v1 status: LEGITIMATE DEFERRAL. The runner logs a WARNING
     * and leaves rows untouched — the per-model PII-column list
     * can only be authored by the owner package (the concrete
     * columns to null / hash and the null-safe fallbacks for
     * downstream reads).
     * See `TODO(retention-anonymize-pii)`.
     */
    case Anonymize = 'anonymize';
}
