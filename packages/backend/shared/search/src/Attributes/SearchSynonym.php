<?php

declare(strict_types=1);

namespace Academorix\Search\Attributes;

use Academorix\Search\Enums\SynonymKind;
use Attribute;

/**
 * Declarative synonym seed on a `#[Searchable]` model.
 *
 * At boot, every `#[SearchSynonym]` on the model is upserted into
 * `search_synonyms` as a platform-seeded row (`is_system = true`).
 * Tenants may disable seeded rows but cannot delete them.
 *
 * ## Example
 *
 * ```php
 * #[SearchSynonym(terms: ['flu', 'influenza', 'grippe'])]
 * #[SearchSynonym(kind: SynonymKind::OneWay, source: 'sneaker', targets: ['trainer', 'kick'])]
 * final class Product extends Model {}
 * ```
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final readonly class SearchSynonym
{
    /**
     * @param  list<string>  $terms     Terms — required for kind =
     *                                  `Equivalent` / `Expansion`.
     * @param  SynonymKind   $kind      Relation kind.
     * @param  string|null   $source    One-way source term (required
     *                                  for kind = `OneWay`).
     * @param  list<string>  $targets   One-way targets (required for
     *                                  kind = `OneWay`).
     * @param  string        $language  ISO-639-1 language tag.
     */
    public function __construct(
        public array $terms = [],
        public SynonymKind $kind = SynonymKind::Equivalent,
        public ?string $source = null,
        public array $targets = [],
        public string $language = 'en',
    ) {
    }
}
