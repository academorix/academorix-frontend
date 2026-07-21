<?php

declare(strict_types=1);

namespace Stackra\Geography\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a language lookup finds no matching row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyLanguageNotFoundException extends StackraException
{
    public const CODE = 'GEOGRAPHY_LANGUAGE_NOT_FOUND';

    public const TRANSLATION_KEY = 'geography::errors.language_not_found';
}
