<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a caller references a flag that is not in the registry.
 *
 * Emitted by the admin `ShowFlag` action, the `feature-flags:enable`
 * and `:disable` commands, and any admin-surface write that names a
 * flag which has no `#[AsFeatureFlag]` counterpart in code.
 * `Checker::active()` does NOT raise this — Requirement 3.9
 * mandates it return the class-default with source `default` for
 * unknown flags.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class UnknownFeatureFlagException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'feature_flags.unknown_flag';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'feature-flags::errors.unknown_flag';

    /**
     * Convenience factory naming the missing flag.
     *
     * @param  string  $flag  The flag identifier that could not be resolved.
     * @return self
     */
    public static function named(string $flag): self
    {
        return (new self("Feature flag '{$flag}' is not registered."))
            ->withContext(['flag' => $flag]);
    }
}
