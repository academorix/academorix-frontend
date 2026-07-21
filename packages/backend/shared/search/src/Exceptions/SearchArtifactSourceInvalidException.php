<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the referenced artifact source is missing or wrong.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchArtifactSourceInvalidException extends Exception
{
    public const CODE = 'SEARCH_ARTIFACT_SOURCE_INVALID';

    public const TRANSLATION_KEY = 'search::errors.artifact_source_invalid';
}
