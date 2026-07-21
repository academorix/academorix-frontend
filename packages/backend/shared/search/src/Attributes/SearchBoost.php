<?php

declare(strict_types=1);

namespace Stackra\Search\Attributes;

use Attribute;

/**
 * Declarative boost spec on a `#[Searchable]` model.
 *
 * Boosts amplify relevance of results matching a particular field
 * or condition. Applied by the engine adapter at query time.
 *
 * ## Example
 *
 * ```php
 * #[SearchBoost(field: 'is_featured', factor: 5.0)]
 * #[SearchBoost(field: 'updated_at', decay: 'exp', scale: '30d')]
 * final class Article extends Model {}
 * ```
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final readonly class SearchBoost
{
    /**
     * @param  string       $field   Field to boost.
     * @param  float        $factor  Multiplier applied to matches.
     * @param  string|null  $decay   Decay function (`gauss`, `exp`,
     *                               `linear`) for time / distance decay.
     * @param  string|null  $scale   Decay scale (e.g. `30d`, `10km`).
     */
    public function __construct(
        public string $field,
        public float $factor = 1.0,
        public ?string $decay = null,
        public ?string $scale = null,
    ) {
    }
}
