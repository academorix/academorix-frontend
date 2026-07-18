<?php

declare(strict_types=1);

namespace Academorix\Storage\Data\Requests;

use Academorix\Storage\Rules\ValidFileKind;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/files/chunked` — chunked upload initiation.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class InitiateChunkedUploadRequestData extends Data
{
    /**
     * @param  string       $targetKind          Target file kind.
     * @param  string       $filename            Client filename.
     * @param  string       $declaredMimeType    Client MIME type.
     * @param  int          $totalSizeBytes      Total byte count.
     * @param  int|null     $chunkSizeBytes      Optional chunk size (default 5MB).
     * @param  string       $protocol            tus / s3_multipart.
     * @param  string|null  $declaredSha256      Optional SHA-256 of full range.
     * @param  string|null  $targetFileableType  Optional polymorphic parent morph type.
     * @param  string|null  $targetFileableId    Optional polymorphic parent key.
     */
    public function __construct(
        #[Required, StringType, Max(64), Rule(new ValidFileKind())]
        public string $targetKind,

        #[Required, StringType, Max(500)]
        public string $filename,

        #[Required, StringType, Max(128), Regex('/^[a-z-]+\/[a-z0-9.+-]+$/')]
        public string $declaredMimeType,

        #[Required, Min(1)]
        public int $totalSizeBytes,

        #[Between(262_144, 5_368_709_120)]
        public ?int $chunkSizeBytes = null,

        #[In(['tus', 's3_multipart'])]
        public string $protocol = 'tus',

        #[StringType, Regex('/^[a-f0-9]{64}$/')]
        public ?string $declaredSha256 = null,

        #[StringType, Max(191)]
        public ?string $targetFileableType = null,

        #[StringType, Max(64)]
        public ?string $targetFileableId = null,
    ) {
    }
}
