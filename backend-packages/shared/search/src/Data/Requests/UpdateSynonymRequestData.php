<?php

declare(strict_types=1);

namespace Academorix\Search\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `PATCH /api/v1/search/synonyms/{synonym}`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateSynonymRequestData extends Data
{
    /**
     * @param  list<string>|null  $terms
     * @param  list<string>|null  $oneWayTargets
     */
    public function __construct(
        #[In(['equivalent', 'one_way', 'expansion'])]
        public ?string $kind = null,

        public ?array $terms = null,

        #[StringType, Max(191)]
        public ?string $oneWaySource = null,

        public ?array $oneWayTargets = null,

        public ?bool $isActive = null,

        #[StringType, Max(500)]
        public ?string $description = null,
    ) {
    }
}
