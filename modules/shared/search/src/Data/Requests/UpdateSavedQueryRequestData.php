<?php

declare(strict_types=1);

namespace Academorix\Search\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `PATCH /api/v1/search/saved-queries/{query}`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateSavedQueryRequestData extends Data
{
    /**
     * @param  list<string>|null         $across
     * @param  array<string, mixed>|null $filters
     * @param  array<string, mixed>|null $facets
     * @param  array<string, mixed>|null $boosts
     */
    public function __construct(
        #[StringType, Max(191)]
        public ?string $name = null,

        public ?array $across = null,

        #[StringType, Max(512)]
        public ?string $query = null,

        public ?array $filters = null,
        public ?array $facets = null,
        public ?array $boosts = null,

        public ?bool $isShared = null,
        public ?bool $isSmartList = null,

        #[StringType, Max(500)]
        public ?string $description = null,
    ) {
    }
}
