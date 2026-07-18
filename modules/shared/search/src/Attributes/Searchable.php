<?php

declare(strict_types=1);

namespace Academorix\Search\Attributes;

use Academorix\Search\Enums\SearchEngine;
use Attribute;

/**
 * Marks a Model as opted into the search pipeline.
 *
 * Discovered at boot by the framework's generic hydration pump via
 * the `#[HydratesFrom(Searchable::class)]` declaration on
 * {@see \Academorix\Search\Contracts\Services\EngineRegistryInterface::register()}.
 * The registry mirrors each hit into a `search_indexes` row + wires
 * the model's Scout observers.
 *
 * ## Example
 *
 * ```php
 * #[Searchable(engine: SearchEngine::Meilisearch, language: 'en')]
 * final class Athlete extends Model
 * {
 *     use HasSearchable;
 * }
 * ```
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class Searchable
{
    /**
     * @param  SearchEngine  $engine              Engine adapter to bind.
     * @param  string|null   $indexName           Explicit index name;
     *                                            derived from the class
     *                                            name in kebab-case when null.
     * @param  string|null   $language            ISO-639-1 language tag.
     * @param  string|null   $requiredPermission  Per-entity permission gate
     *                                            (e.g. `athletes.viewAny`).
     */
    public function __construct(
        public SearchEngine $engine = SearchEngine::Meilisearch,
        public ?string $indexName = null,
        public ?string $language = null,
        public ?string $requiredPermission = null,
    ) {
    }
}
