<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the search queue kill switch is off.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchQueueDisabledException extends AcademorixException
{
    public const CODE = 'SEARCH_QUEUE_DISABLED';

    public const TRANSLATION_KEY = 'search::errors.queue_disabled';
}
