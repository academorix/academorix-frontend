<?php

declare(strict_types=1);

namespace Stackra\Storage\Data\Requests;

use Stackra\Storage\Enums\FileVisibility;
use Stackra\Storage\Rules\ValidFileKind;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\File;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/files` — single-request
 * uploads (below the chunked-upload threshold).
 *
 * The uploaded file bytes are on `$file`; every remaining field is
 * metadata the module writes onto the resulting `File` row.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UploadFileRequestData extends Data
{
    /**
     * @param  \Illuminate\Http\UploadedFile $file            Uploaded file bytes.
     * @param  string                        $kind            Target file kind.
     * @param  string|null                   $name            Optional display name.
     * @param  string|null                   $collection      spatie media collection (defaults `default`).
     * @param  FileVisibility|null           $visibility      Wire visibility.
     * @param  string|null                   $fileableType    Polymorphic parent morph type.
     * @param  string|null                   $fileableId      Polymorphic parent key.
     * @param  array<string, mixed>|null     $metadata        HasMetadata bag.
     */
    public function __construct(
        #[Required, File]
        public \Illuminate\Http\UploadedFile $file,

        #[Required, StringType, Max(64), Rule(new ValidFileKind())]
        public string $kind,

        #[StringType, Max(500)]
        public ?string $name = null,

        #[StringType, Max(64)]
        public ?string $collection = null,

        #[Enum(FileVisibility::class)]
        public ?FileVisibility $visibility = null,

        #[StringType, Max(191)]
        public ?string $fileableType = null,

        #[StringType, Max(64)]
        public ?string $fileableId = null,

        /** @var array<string, mixed>|null */
        public ?array $metadata = null,
    ) {
    }
}
