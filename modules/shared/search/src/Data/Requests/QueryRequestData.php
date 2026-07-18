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
 * Validated request payload for `GET /api/v1/search`.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class QueryRequestData extends Data
{
    /**
     * @param  string       $q         Query text.
     * @param  string|null  $index     Optional index filter.
     * @param  int          $page      Requested page (1-based).
     * @param  int          $perPage   Requested page size.
     * @param  string|null  $language  Optional query language.
     * @param  bool         $highlight Whether to include highlights.
     */
    public function __construct(
        #[Required, StringType, Max(512)]
        public string $q,

        #[StringType, Max(191)]
        public ?string $index = null,

        #[Between(1, 10000)]
        public int $page = 1,

        #[Between(1, 100)]
        public int $perPage = 20,

        #[StringType, Max(8)]
        public ?string $language = null,

        public bool $highlight = false,
    ) {
    }
}
