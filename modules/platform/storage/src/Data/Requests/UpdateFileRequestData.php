<?php

declare(strict_types=1);

namespace Academorix\Storage\Data\Requests;

use Academorix\Storage\Enums\FileVisibility;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `PATCH /api/v1/files/{file}`.
 *
 * Only user-editable fields are allowed — `name`, `visibility`,
 * `metadata`. Every other column is either immutable (`sha256`,
 * `path`) or managed by the module (`virus_scan_state`).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateFileRequestData extends Data
{
    /**
     * @param  string|null                $name        Optional display-name update.
     * @param  FileVisibility|null        $visibility  Optional visibility flip.
     * @param  array<string, mixed>|null  $metadata    Optional metadata patch.
     */
    public function __construct(
        #[StringType, Max(500)]
        public ?string $name = null,

        #[Enum(FileVisibility::class)]
        public ?FileVisibility $visibility = null,

        /** @var array<string, mixed>|null */
        public ?array $metadata = null,
    ) {
    }
}
