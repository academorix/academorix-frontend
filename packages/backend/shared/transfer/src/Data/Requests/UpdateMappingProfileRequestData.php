<?php

declare(strict_types=1);

namespace Stackra\Transfer\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for
 * `PATCH /api/v1/transfer/mapping-profiles/{profile}`.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateMappingProfileRequestData extends Data
{
    /**
     * @param  string|null                 $name        Rename the profile.
     * @param  array<string, string>|null  $headerMap   New header map.
     * @param  string|null                 $description New description.
     * @param  bool|null                   $isShared    Toggle sharing.
     */
    public function __construct(
        #[StringType, Max(191)]
        public ?string $name = null,

        #[ArrayType]
        public ?array $headerMap = null,

        #[StringType, Max(1000)]
        public ?string $description = null,

        public ?bool $isShared = null,
    ) {
    }
}
