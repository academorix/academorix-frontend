<?php

declare(strict_types=1);

namespace Academorix\Geography\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the local GeoLite2-City.mmdb is missing. Non-fatal —
 * the resolver falls back to ip-api.com.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyMaxMindMissingException extends AcademorixException
{
    public const CODE = 'GEOGRAPHY_MAXMIND_MISSING';

    public const TRANSLATION_KEY = 'geography::errors.maxmind_missing';
}
