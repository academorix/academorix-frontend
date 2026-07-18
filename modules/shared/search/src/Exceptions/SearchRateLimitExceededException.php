<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the caller exceeds the per-minute rate cap.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchRateLimitExceededException extends AcademorixException
{
    public const CODE = 'SEARCH_RATE_LIMIT_EXCEEDED';

    public const TRANSLATION_KEY = 'search::errors.rate_limit_exceeded';
}
