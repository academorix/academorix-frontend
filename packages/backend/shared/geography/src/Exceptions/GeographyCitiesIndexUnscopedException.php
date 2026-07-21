<?php

declare(strict_types=1);

namespace Stackra\Geography\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the cities index is called without a `country_id` or
 * `state_id` filter. Refuses a full-table scan across ~150k rows.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyCitiesIndexUnscopedException extends Exception
{
    public const CODE = 'GEOGRAPHY_CITIES_INDEX_UNSCOPED';

    public const TRANSLATION_KEY = 'geography::errors.cities_index_unscoped';
}
