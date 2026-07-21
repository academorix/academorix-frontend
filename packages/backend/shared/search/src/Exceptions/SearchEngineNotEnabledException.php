<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when the engine adapter exists but feature toggle or
 * entitlement disables it.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchEngineNotEnabledException extends StackraException
{
    public const CODE = 'SEARCH_ENGINE_NOT_ENABLED';

    public const TRANSLATION_KEY = 'search::errors.engine_not_enabled';
}
