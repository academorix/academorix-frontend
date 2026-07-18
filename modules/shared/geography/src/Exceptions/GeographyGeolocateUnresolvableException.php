<?php

declare(strict_types=1);

namespace Academorix\Geography\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised (or attached as context) when both MaxMind AND ip-api.com
 * failed. The wire response is HTTP 200 with `data:null` so callers
 * can gracefully continue — not an error state per se, but the
 * source-of-truth code for observability.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyGeolocateUnresolvableException extends AcademorixException
{
    public const CODE = 'GEOGRAPHY_GEOLOCATE_UNRESOLVABLE';

    public const TRANSLATION_KEY = 'geography::errors.geolocate_unresolvable';
}
