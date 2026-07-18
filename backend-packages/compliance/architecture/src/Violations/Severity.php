<?php

/**
 * @file packages/architecture/src/Violations/Severity.php
 *
 * @description
 * Severity levels for architectural violations. Kept small
 * (`Warning` / `Error`) rather than mirroring PSR-3 log levels
 * because the audience is human reviewers, not a log ingestion
 * pipeline.
 *
 * ## Semantics
 *
 *   - **Error** — hard failure. `artisan academorix:architecture:check`
 *     exits non-zero when at least one Error is present. Blocks
 *     CI.
 *
 *   - **Warning** — flagged but non-blocking. Useful for rules
 *     that are still being rolled out or for opt-in rules that
 *     you want to advertise without making them mandatory.
 *
 * Rules choose their own default severity; app-level config can
 * override per-rule.
 */

declare(strict_types=1);

namespace Academorix\Architecture\Violations;

use Academorix\Enum\Enum;

/**
 * Two-level severity — human-facing, not a log level.
 */
enum Severity: string
{
    use Enum;

    /** Blocks CI. Non-zero exit. */
    case Error = 'error';

    /** Reported but does not block. */
    case Warning = 'warning';

    /**
     * Convenience — `true` when this severity should fail the
     * check. Only `Error` fails.
     */
    public function fails(): bool
    {
        return $this === self::Error;
    }
}
