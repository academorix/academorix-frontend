<?php

declare(strict_types=1);

namespace Stackra\Search\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `POST /api/v1/search/click`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ClickThroughRequestData extends Data
{
    public function __construct(
        #[Required, StringType, Max(64)]
        public string $searchSessionId,

        #[Required, StringType, Max(191)]
        public string $clickedResultType,

        #[Required, StringType, Max(64)]
        public string $clickedResultId,

        #[Required, Between(1, 10000)]
        public int $clickedPosition,
    ) {
    }
}
