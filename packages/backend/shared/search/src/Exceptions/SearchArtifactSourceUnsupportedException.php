<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when reindex-from-artifact is disabled for the tenant.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchArtifactSourceUnsupportedException extends StackraException
{
    public const CODE = 'SEARCH_ARTIFACT_SOURCE_UNSUPPORTED';

    public const TRANSLATION_KEY = 'search::errors.artifact_source_unsupported';
}
