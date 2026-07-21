<?php

declare(strict_types=1);

namespace Stackra\Search\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised (or surfaced) when `SearchIndex.config_hash` diverges from the
 * compiled hash of the model's `#[SearchField]` / `#[SearchFacet]` /
 * `#[SearchBoost]` attributes.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchConfigHashDriftException extends Exception
{
    public const CODE = 'SEARCH_CONFIG_HASH_DRIFT';

    public const TRANSLATION_KEY = 'search::errors.config_hash_drift';
}
