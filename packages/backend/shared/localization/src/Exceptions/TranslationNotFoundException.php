<?php

declare(strict_types=1);

namespace Stackra\Localization\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a translation lookup expects a row but none is
 * visible — either the row doesn't exist or belongs to a different
 * tenant (returned as 404 to avoid cross-tenant enumeration).
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TranslationNotFoundException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'localization.translation_not_found';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'localization::errors.translation_not_found';
}
