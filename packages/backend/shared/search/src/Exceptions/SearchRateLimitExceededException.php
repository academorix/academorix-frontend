<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the caller exceeds the per-minute rate cap.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchRateLimitExceededException extends Exception
{
    public const CODE = 'SEARCH_RATE_LIMIT_EXCEEDED';

    public const TRANSLATION_KEY = 'search::errors.rate_limit_exceeded';
}
