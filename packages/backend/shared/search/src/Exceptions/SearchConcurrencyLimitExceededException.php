<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a tenant exceeds `search.max_reindex_concurrency`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchConcurrencyLimitExceededException extends StackraException
{
    public const CODE = 'SEARCH_CONCURRENCY_LIMIT_EXCEEDED';

    public const TRANSLATION_KEY = 'search::errors.concurrency_limit_exceeded';
}
