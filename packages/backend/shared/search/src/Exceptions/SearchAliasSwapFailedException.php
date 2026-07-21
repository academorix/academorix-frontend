<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the engine-native alias-swap operation fails.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchAliasSwapFailedException extends Exception
{
    public const CODE = 'SEARCH_ALIAS_SWAP_FAILED';

    public const TRANSLATION_KEY = 'search::errors.alias_swap_failed';
}
