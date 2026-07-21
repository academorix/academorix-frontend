<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the requested engine is not registered in EngineRegistry.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchEngineNotSupportedException extends Exception
{
    public const CODE = 'SEARCH_ENGINE_NOT_SUPPORTED';

    public const TRANSLATION_KEY = 'search::errors.engine_not_supported';
}
