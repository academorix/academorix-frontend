<?php

declare(strict_types=1);

namespace Academorix\Geography\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when a state lookup finds no matching row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyStateNotFoundException extends AcademorixException
{
    public const CODE = 'GEOGRAPHY_STATE_NOT_FOUND';

    public const TRANSLATION_KEY = 'geography::errors.state_not_found';
}
