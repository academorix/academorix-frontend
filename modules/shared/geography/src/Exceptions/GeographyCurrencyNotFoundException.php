<?php

declare(strict_types=1);

namespace Academorix\Geography\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a currency lookup finds no matching row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyCurrencyNotFoundException extends AcademorixException
{
    public const CODE = 'GEOGRAPHY_CURRENCY_NOT_FOUND';

    public const TRANSLATION_KEY = 'geography::errors.currency_not_found';
}
