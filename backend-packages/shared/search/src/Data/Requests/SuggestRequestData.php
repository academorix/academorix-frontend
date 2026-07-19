<?php

declare(strict_types=1);

namespace Academorix\Search\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for `GET /api/v1/search/suggest`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class SuggestRequestData extends Data
{
    /**
     * @param  string       $q         Prefix text.
     * @param  string|null  $index     Optional index filter.
     * @param  int          $limit     Max suggestions to return.
     * @param  string|null  $language  Optional language.
     */
    public function __construct(
        #[Required, StringType, Max(191)]
        public string $q,

        #[StringType, Max(191)]
        public ?string $index = null,

        #[Between(1, 20)]
        public int $limit = 10,

        #[StringType, Max(8)]
        public ?string $language = null,
    ) {
    }
}
