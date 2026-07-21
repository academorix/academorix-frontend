<?php

declare(strict_types=1);

namespace Stackra\Localization\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when a platform-language lookup finds no matching row —
 * either the row doesn't exist, was soft-deleted past retention, or
 * carries `is_platform_active=false`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class PlatformLanguageNotFoundException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'localization.platform_language_not_found';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'localization::errors.platform_language_not_found';
}
