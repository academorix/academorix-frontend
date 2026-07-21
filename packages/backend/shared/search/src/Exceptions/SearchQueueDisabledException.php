<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the search queue kill switch is off.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchQueueDisabledException extends Exception
{
    public const CODE = 'SEARCH_QUEUE_DISABLED';

    public const TRANSLATION_KEY = 'search::errors.queue_disabled';
}
