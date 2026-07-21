<?php

declare(strict_types=1);

namespace Stackra\Localization\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a caller tries to dispatch a bulk translation job for
 * the same `(kind, target_locale)` combination while another job is
 * still running.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TranslationJobInFlightException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'localization.translation_job_in_flight';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'localization::errors.translation_job_in_flight';
}
