<?php

declare(strict_types=1);

namespace Academorix\Geography\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a timezone lookup finds no matching row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyTimezoneNotFoundException extends AcademorixException
{
    public const CODE = 'GEOGRAPHY_TIMEZONE_NOT_FOUND';

    public const TRANSLATION_KEY = 'geography::errors.timezone_not_found';
}
