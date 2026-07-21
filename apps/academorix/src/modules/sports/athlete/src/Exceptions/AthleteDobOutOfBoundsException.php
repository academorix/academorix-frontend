<?php

declare(strict_types=1);

namespace Stackra\Athlete\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when `date_of_birth` lies outside the accepted range —
 * either in the future or older than the configured max age.
 *
 * ## Factories
 *
 *   - {@see self::forFuture()}  — DOB parsed successfully but sits
 *     in the future. Attaches the parsed date to `context.dob`.
 *   - {@see self::forRange()}   — DOB is a valid date but its whole-
 *     year age is outside `[min, max]`. Attaches the derived age
 *     bounds to `context.min` / `context.max` so the FE can render a
 *     precise error.
 *
 * @category Athlete
 *
 * @since    0.1.0
 */
final class AthleteDobOutOfBoundsException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'ATHLETE_DOB_OUT_OF_BOUNDS';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'athlete::errors.ATHLETE_DOB_OUT_OF_BOUNDS';

    /**
     * Factory for the "date is in the future" path.
     */
    public static function forFuture(string $dob): self
    {
        return (new self(\sprintf(
            'date_of_birth %s is in the future.',
            $dob,
        )))->withContext(['dob' => $dob, 'kind' => 'future']);
    }

    /**
     * Factory for the "date is a valid past date but outside the
     * accepted age range" path.
     */
    public static function forRange(string $dob, int $minYears, int $maxYears): self
    {
        return (new self(\sprintf(
            'date_of_birth %s falls outside the accepted age range [%d, %d] years.',
            $dob,
            $minYears,
            $maxYears,
        )))->withContext([
            'dob' => $dob,
            'kind' => 'out_of_range',
            'min_age_years' => $minYears,
            'max_age_years' => $maxYears,
        ]);
    }
}
