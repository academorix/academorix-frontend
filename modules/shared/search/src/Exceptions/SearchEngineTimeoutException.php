<?php

declare(strict_types=1);

namespace Academorix\Search\Exceptions;

use Academorix\Exceptions\AcademorixException;

/**
 * Raised when the engine does not respond within
 * `config('search.query.timeout_ms')`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchEngineTimeoutException extends AcademorixException
{
    public const CODE = 'SEARCH_ENGINE_TIMEOUT';

    public const TRANSLATION_KEY = 'search::errors.engine_timeout';
}
