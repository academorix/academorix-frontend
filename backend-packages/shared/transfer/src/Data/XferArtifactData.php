<?php

declare(strict_types=1);

namespace Academorix\Transfer\Data;

use Academorix\Transfer\Contracts\Data\XferArtifactInterface;
use Academorix\Transfer\Models\XferArtifact;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see XferArtifact}.
 *
 * `path` and `checksum_sha256` are wire-hidden — do not include here.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class XferArtifactData extends Data
{
    /**
     * @param  string       $id         Prefixed ULID `xart_<26>`.
     * @param  string       $kind       `result` / `errors` / `source` / `template` / `workbook`.
     * @param  string|null  $format     File format if applicable.
     * @param  string       $filename   Basename shown to the user.
     * @param  int          $sizeBytes  File size in bytes.
     */
    public function __construct(
        public string $id,
        public string $kind,
        public ?string $format,
        public string $filename,
        public int $sizeBytes,
    ) {
    }

    /**
     * Build the DTO from a model.
     */
    public static function fromModel(XferArtifact $artifact): self
    {
        return new self(
            id: (string) $artifact->getKey(),
            kind: (string) $artifact->{XferArtifactInterface::ATTR_KIND}?->value,
            format: $artifact->{XferArtifactInterface::ATTR_FORMAT}?->value,
            filename: (string) $artifact->{XferArtifactInterface::ATTR_FILENAME},
            sizeBytes: (int) $artifact->{XferArtifactInterface::ATTR_SIZE_BYTES},
        );
    }
}
