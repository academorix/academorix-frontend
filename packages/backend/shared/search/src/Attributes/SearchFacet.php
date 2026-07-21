<?php

declare(strict_types=1);

namespace Stackra\Search\Attributes;

use Attribute;

/**
 * Marks one column on a `#[Searchable]` model as a facet.
 *
 * ## Example
 *
 * ```php
 * #[SearchFacet(name: 'status')]
 * public string $status;
 * ```
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_PROPERTY | Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
final readonly class SearchFacet
{
    /**
     * @param  string  $name      Facet name emitted to the engine.
     * @param  string  $type      Facet type — `string`, `numeric`,
     *                            `date`, or `boolean`.
     * @param  int     $maxValues Maximum distinct values kept per facet.
     */
    public function __construct(
        public string $name,
        public string $type = 'string',
        public int $maxValues = 100,
    ) {
    }
}
