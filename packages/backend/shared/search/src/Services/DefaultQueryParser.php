<?php

declare(strict_types=1);

namespace Stackra\Search\Services;

use Stackra\Search\Contracts\Services\QueryParserInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Minimum-viable {@see QueryParserInterface}.
 *
 * Returns an AST that carries the raw query text + normalised
 * filter map. Real grammar parsing (boolean expressions, phrase
 * quoting, prefix wildcards) lands with the engine-adapter build-out.
 *
 * `#[Singleton]` — the parser is a stateless pure function.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultQueryParser implements QueryParserInterface
{
    /**
     * {@inheritDoc}
     */
    public function parse(string $query, array $filters = []): array
    {
        return [
            'query'   => \trim($query),
            'filters' => $filters,
            'ast'     => [
                'kind'  => 'raw',
                'text'  => $query,
            ],
        ];
    }
}
