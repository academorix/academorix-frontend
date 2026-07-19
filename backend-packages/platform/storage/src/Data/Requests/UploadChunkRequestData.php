<?php

declare(strict_types=1);

namespace Academorix\Storage\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `PATCH /api/v1/files/chunked/{upload}`.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UploadChunkRequestData extends Data
{
    /**
     * @param  int          $index   Zero-based chunk index.
     * @param  string|null  $sha256  Optional SHA-256 of the chunk.
     */
    public function __construct(
        #[Required, IntegerType, Min(0)]
        public int $index,

        #[StringType, Regex('/^[a-f0-9]{64}$/')]
        public ?string $sha256 = null,
    ) {
    }
}
