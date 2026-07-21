<?php

declare(strict_types=1);

namespace Stackra\Geography\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a city lookup finds no matching row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyCityNotFoundException extends StackraException
{
    public const CODE = 'GEOGRAPHY_CITY_NOT_FOUND';

    public const TRANSLATION_KEY = 'geography::errors.city_not_found';
}
