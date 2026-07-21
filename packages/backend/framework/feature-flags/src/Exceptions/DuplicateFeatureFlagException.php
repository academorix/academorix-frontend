<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Exceptions;

use Stackra\Exceptions\AcademorixException;

/**
 * Raised at `package:discover` when two classes declare the same flag name.
 *
 * `FeatureFlagDiscovery` treats a collision as a fatal boot
 * failure — the exception surfaces to the artisan output and
 * prevents the application from booting. The context envelope
 * carries the two colliding class FQNs so the operator can pick
 * one and remove the attribute from the other.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class DuplicateFeatureFlagException extends AcademorixException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'feature_flags.duplicate_flag';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'feature-flags::errors.duplicate_flag';

    /**
     * Convenience factory used by the discovery raise path.
     *
     * @param  string  $flag       Colliding flag name.
     * @param  string  $existing   FQN of the previously-registered class.
     * @param  string  $duplicate  FQN of the offending duplicate class.
     * @return self
     */
    public static function between(string $flag, string $existing, string $duplicate): self
    {
        return (new self(sprintf(
            'Duplicate feature flag "%s" declared by %s and %s.',
            $flag,
            $existing,
            $duplicate,
        )))->withContext([
            'flag'      => $flag,
            'existing'  => $existing,
            'duplicate' => $duplicate,
        ]);
    }
}
