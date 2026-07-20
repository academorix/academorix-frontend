<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when disabling a hierarchy flag would orphan existing rows.
 *
 * Emitted by the hierarchy admin action when an operator attempts
 * to disable `hierarchy.regions` / `.organizations` /
 * `.multi_branch` while more than one row exists at the affected
 * level, unless the caller also passed `force = true` AND holds
 * the `platform_admin` role (Requirement 8.6).
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class HierarchyDisableBlockedException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'feature_flags.hierarchy_disable_blocked';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'feature-flags::errors.hierarchy_disable_blocked';

    /**
     * Convenience factory naming the flag + level + row count.
     *
     * @param  string  $flag      Hierarchy flag being disabled.
     * @param  string  $level     Scope level with orphan-risk rows.
     * @param  int     $rowCount  Current row count at that level.
     * @return self
     */
    public static function forLevel(string $flag, string $level, int $rowCount): self
    {
        return (new self(sprintf(
            "Cannot disable '%s': %d rows exist at scope level '%s'. Pass force=true to override.",
            $flag,
            $rowCount,
            $level,
        )))->withContext([
            'flag'      => $flag,
            'level'     => $level,
            'row_count' => $rowCount,
        ]);
    }
}
