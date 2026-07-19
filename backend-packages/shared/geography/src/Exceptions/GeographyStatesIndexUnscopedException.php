<?php

declare(strict_types=1);

namespace Academorix\Geography\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the states index is called without a `country_id`
 * filter. Refuses a full-table scan across ~5000 rows.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class GeographyStatesIndexUnscopedException extends AcademorixException
{
    public const CODE = 'GEOGRAPHY_STATES_INDEX_UNSCOPED';

    public const TRANSLATION_KEY = 'geography::errors.states_index_unscoped';
}
