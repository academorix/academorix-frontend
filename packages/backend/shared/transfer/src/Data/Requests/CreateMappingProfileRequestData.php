<?php

declare(strict_types=1);

namespace Stackra\Transfer\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated request payload for
 * `POST /api/v1/transfer/mapping-profiles`.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateMappingProfileRequestData extends Data
{
    /**
     * @param  string                 $entity      Entity registry key.
     * @param  string                 $name        Profile display name.
     * @param  array<string, string>  $headerMap   Source header → target column map.
     * @param  string|null            $description Optional operator note.
     * @param  bool                   $isShared    Whether the profile is tenant-wide.
     */
    public function __construct(
        #[Required, StringType, Max(128)]
        public string $entity,

        #[Required, StringType, Max(191)]
        public string $name,

        #[Required, ArrayType]
        public array $headerMap,

        #[StringType, Max(1000)]
        public ?string $description = null,

        public bool $isShared = false,
    ) {
    }
}
