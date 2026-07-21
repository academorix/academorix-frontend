<?php

declare(strict_types=1);

namespace Stackra\Localization\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a driver rejects a `(source, target)` locale pair —
 * DeepL is the primary case (limited European-language coverage).
 * The manager should have caught this at resolve time via
 * `TranslatorDriverInterface::supportsLocalePair()`; the exception
 * is defensive.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class DriverUnsupportedLocalePairException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'localization.driver_unsupported_locale_pair';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'localization::errors.driver_unsupported_locale_pair';
}
