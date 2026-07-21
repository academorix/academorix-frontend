<?php

declare(strict_types=1);

namespace Stackra\Geography\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the local GeoLite2-City.mmdb is older than the
 * configured stale window. Triggers a refresh via the listener chain
 * on the accompanying `MaxMindDatabaseStale` event.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyMaxMindStaleException extends Exception
{
    public const CODE = 'GEOGRAPHY_MAXMIND_STALE';

    public const TRANSLATION_KEY = 'geography::errors.maxmind_stale';
}
