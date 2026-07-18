<?php

declare(strict_types=1);

namespace Academorix\Geography\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the submitted IP is not a valid IPv4 / IPv6 address.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyGeolocateInvalidIpException extends AcademorixException
{
    public const CODE = 'GEOGRAPHY_GEOLOCATE_INVALID_IP';

    public const TRANSLATION_KEY = 'geography::errors.geolocate_invalid_ip';
}
