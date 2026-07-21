<?php

declare(strict_types=1);

namespace Stackra\Storage\Data;

use Stackra\Storage\Contracts\Data\ChunkedUploadInterface;
use Stackra\Storage\Enums\ChunkedUploadState;
use Stackra\Storage\Models\ChunkedUpload;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see ChunkedUpload}.
 *
 * `upload_url` is only surfaced on the initiate response — the
 * `withUploadUrl()` static factory adds it explicitly.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class ChunkedUploadData extends Data
{
    /**
     * @param  string                          $id                    Prefixed ULID `chu_<26>`.
     * @param  string                          $tenantId              Owning tenant.
     * @param  string                          $ownerId               Uploader.
     * @param  string                          $targetKind            Target file kind.
     * @param  string|null                     $targetFileableType    Polymorphic parent.
     * @param  string|null                     $targetFileableId      Polymorphic key.
     * @param  string                          $protocol              tus / s3_multipart.
     * @param  string                          $filename              Client filename.
     * @param  string                          $declaredMimeType      Client MIME.
     * @param  string|null                     $declaredSha256        Client-declared SHA-256.
     * @param  int                             $totalSizeBytes        Total byte count.
     * @param  int                             $uploadedBytes         Progress bytes.
     * @param  int                             $chunkSizeBytes        Expected chunk size.
     * @param  ChunkedUploadState              $state                 State machine slot.
     * @param  \DateTimeInterface              $expiresAt             TTL.
     * @param  \DateTimeInterface              $initiatedAt           Initiation.
     * @param  \DateTimeInterface|null         $finalizedAt           Terminal timestamp.
     * @param  string|null                     $abortReason           Abort reason.
     * @param  string|null                     $resultingFileId       Materialised File on completion.
     * @param  string|null                     $uploadUrl             Only on initiate response.
     * @param  array<int, array<string, mixed>> $chunks               Per-chunk ledger.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $ownerId,
        public string $targetKind,
        public ?string $targetFileableType,
        public ?string $targetFileableId,
        public string $protocol,
        public string $filename,
        public string $declaredMimeType,
        public ?string $declaredSha256,
        public int $totalSizeBytes,
        public int $uploadedBytes,
        public int $chunkSizeBytes,
        public ChunkedUploadState $state,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $expiresAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $initiatedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $finalizedAt = null,
        public ?string $abortReason = null,
        public ?string $resultingFileId = null,
        public ?string $uploadUrl = null,
        /** @var array<int, array<string, mixed>> */
        public array $chunks = [],
    ) {
    }

    /**
     * Build from a ChunkedUpload model without exposing the
     * provider URL — this is the shape used on subsequent reads.
     */
    public static function fromModel(ChunkedUpload $upload): self
    {
        return self::build($upload, includeUploadUrl: false);
    }

    /**
     * Build INCLUDING the provider upload URL — used ONLY on the
     * initiate response so the client can start streaming chunks.
     */
    public static function withUploadUrl(ChunkedUpload $upload): self
    {
        return self::build($upload, includeUploadUrl: true);
    }

    private static function build(ChunkedUpload $upload, bool $includeUploadUrl): self
    {
        $stateRaw = $upload->{ChunkedUploadInterface::ATTR_STATE};
        $state    = $stateRaw instanceof ChunkedUploadState
            ? $stateRaw
            : (ChunkedUploadState::tryFrom((string) $stateRaw) ?? ChunkedUploadState::Initiating);

        /** @var array<int, array<string, mixed>> $chunks */
        $chunks = (array) ($upload->{ChunkedUploadInterface::ATTR_CHUNKS} ?? []);

        return new self(
            id: (string) $upload->getKey(),
            tenantId: (string) $upload->{ChunkedUploadInterface::ATTR_TENANT_ID},
            ownerId: (string) $upload->{ChunkedUploadInterface::ATTR_OWNER_ID},
            targetKind: (string) $upload->{ChunkedUploadInterface::ATTR_TARGET_KIND},
            targetFileableType: $upload->{ChunkedUploadInterface::ATTR_TARGET_FILEABLE_TYPE},
            targetFileableId: $upload->{ChunkedUploadInterface::ATTR_TARGET_FILEABLE_ID},
            protocol: (string) $upload->{ChunkedUploadInterface::ATTR_PROTOCOL},
            filename: (string) $upload->{ChunkedUploadInterface::ATTR_FILENAME},
            declaredMimeType: (string) $upload->{ChunkedUploadInterface::ATTR_DECLARED_MIME_TYPE},
            declaredSha256: $upload->{ChunkedUploadInterface::ATTR_DECLARED_SHA256},
            totalSizeBytes: (int) $upload->{ChunkedUploadInterface::ATTR_TOTAL_SIZE_BYTES},
            uploadedBytes: (int) $upload->{ChunkedUploadInterface::ATTR_UPLOADED_BYTES},
            chunkSizeBytes: (int) $upload->{ChunkedUploadInterface::ATTR_CHUNK_SIZE_BYTES},
            state: $state,
            expiresAt: $upload->{ChunkedUploadInterface::ATTR_EXPIRES_AT},
            initiatedAt: $upload->{ChunkedUploadInterface::ATTR_INITIATED_AT},
            finalizedAt: $upload->{ChunkedUploadInterface::ATTR_FINALIZED_AT},
            abortReason: $upload->{ChunkedUploadInterface::ATTR_ABORT_REASON},
            resultingFileId: $upload->{ChunkedUploadInterface::ATTR_RESULTING_FILE_ID},
            uploadUrl: $includeUploadUrl ? (string) $upload->{ChunkedUploadInterface::ATTR_UPLOAD_URL} : null,
            chunks: $chunks,
        );
    }
}
