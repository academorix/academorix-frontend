<?php

declare(strict_types=1);

namespace Stackra\Geography\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the submitted IP is private / loopback / reserved.
 * MaxMind + ip-api.com both refuse these.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyGeolocatePrivateIpException extends Exception
{
    public const CODE = 'GEOGRAPHY_GEOLOCATE_PRIVATE_IP';

    public const TRANSLATION_KEY = 'geography::errors.geolocate_private_ip';
}
