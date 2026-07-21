<?php

declare(strict_types=1);

namespace Stackra\Search\Attributes;

use Attribute;

/**
 * Marks one column on a `#[Searchable]` model as indexed.
 *
 * ## Example
 *
 * ```php
 * #[SearchField(name: 'full_name', weight: 3.0, prefix: true)]
 * public string $fullName;
 * ```
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_PROPERTY | Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
final readonly class SearchField
{
    /**
     * @param  string       $name        Field name emitted to the engine.
     * @param  float        $weight      Relevance weight (default 1.0).
     * @param  bool         $prefix      When true, the field is searchable
     *                                   via prefix / autocomplete.
     * @param  bool         $filterable  When true, the field can be filtered on.
     * @param  bool         $sortable    When true, the field can be sorted on.
     * @param  bool         $highlight   When true, the field participates
     *                                   in highlighting.
     * @param  string|null  $language    Optional per-field language override.
     */
    public function __construct(
        public string $name,
        public float $weight = 1.0,
        public bool $prefix = false,
        public bool $filterable = false,
        public bool $sortable = false,
        public bool $highlight = false,
        public ?string $language = null,
    ) {
    }
}
