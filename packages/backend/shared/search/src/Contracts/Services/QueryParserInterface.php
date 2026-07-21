<?php

declare(strict_types=1);

namespace Stackra\Search\Contracts\Services;

use Stackra\Search\Services\DefaultQueryParser;
use Illuminate\Container\Attributes\Bind;

/**
 * Parses the query grammar used by the `filter[...]=...` / boolean
 * query surface into a normalised representation the engine adapter
 * can translate.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(DefaultQueryParser::class)]
interface QueryParserInterface
{
    /**
     * Parse a raw query string + filter map into a normalised AST.
     *
     * @param  string               $query    Raw query text.
     * @param  array<string, mixed> $filters  Filter map from the request.
     * @return array<string, mixed>           Normalised AST.
     */
    public function parse(string $query, array $filters = []): array;
}
