<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when a tenant exceeds its `search.max_indexes` entitlement.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchIndexLimitExceededException extends StackraException
{
    public const CODE = 'SEARCH_INDEX_LIMIT_EXCEEDED';

    public const TRANSLATION_KEY = 'search::errors.index_limit_exceeded';
}
