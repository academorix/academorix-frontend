<?php

declare(strict_types=1);

namespace Academorix\Geography\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the tenant's monthly `geography.geolocate.month`
 * entitlement quota is exhausted.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyGeolocateQuotaExceededException extends AcademorixException
{
    public const CODE = 'GEOGRAPHY_GEOLOCATE_QUOTA_EXCEEDED';

    public const TRANSLATION_KEY = 'geography::errors.geolocate_quota_exceeded';
}
