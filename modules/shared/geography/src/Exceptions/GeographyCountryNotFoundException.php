<?php

declare(strict_types=1);

namespace Academorix\Geography\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a country lookup finds no matching row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyCountryNotFoundException extends AcademorixException
{
    public const CODE = 'GEOGRAPHY_COUNTRY_NOT_FOUND';

    public const TRANSLATION_KEY = 'geography::errors.country_not_found';
}
