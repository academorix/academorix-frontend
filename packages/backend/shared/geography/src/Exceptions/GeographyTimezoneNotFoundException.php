<?php

declare(strict_types=1);

namespace Stackra\Geography\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a timezone lookup finds no matching row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyTimezoneNotFoundException extends StackraException
{
    public const CODE = 'GEOGRAPHY_TIMEZONE_NOT_FOUND';

    public const TRANSLATION_KEY = 'geography::errors.timezone_not_found';
}
