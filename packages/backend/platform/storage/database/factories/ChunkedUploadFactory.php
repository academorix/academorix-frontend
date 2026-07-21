<?php

declare(strict_types=1);

namespace Stackra\Storage\Database\Factories;

use Stackra\Storage\Contracts\Data\ChunkedUploadInterface;
use Stackra\Storage\Enums\ChunkedUploadState;
use Stackra\Storage\Enums\FileKind as FileKindEnum;
use Stackra\Storage\Models\ChunkedUpload;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see ChunkedUpload}.
 *
 * @extends Factory<ChunkedUpload>
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class ChunkedUploadFactory extends Factory
{
    /**
     * @var class-string<ChunkedUpload>
     */
    protected $model = ChunkedUpload::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $now = \Carbon\CarbonImmutable::now();

        return [
            ChunkedUploadInterface::ATTR_ID                 => 'chu_' . Str::ulid()->toBase32(),
            ChunkedUploadInterface::ATTR_TENANT_ID          => 'ten_' . Str::ulid()->toBase32(),
            ChunkedUploadInterface::ATTR_OWNER_ID           => 'usr_' . Str::ulid()->toBase32(),
            ChunkedUploadInterface::ATTR_TARGET_KIND        => FileKindEnum::Video->value,
            ChunkedUploadInterface::ATTR_PROTOCOL           => 'tus',
            ChunkedUploadInterface::ATTR_UPLOAD_URL         => 'https://upload.example.com/tus/' . Str::random(24),
            ChunkedUploadInterface::ATTR_FILENAME           => 'sample-video.mp4',
            ChunkedUploadInterface::ATTR_DECLARED_MIME_TYPE => 'video/mp4',
            ChunkedUploadInterface::ATTR_TOTAL_SIZE_BYTES   => 200_000_000,
            ChunkedUploadInterface::ATTR_UPLOADED_BYTES     => 0,
            ChunkedUploadInterface::ATTR_CHUNKS             => [],
            ChunkedUploadInterface::ATTR_CHUNK_SIZE_BYTES   => 5_242_880,
            ChunkedUploadInterface::ATTR_STATE              => ChunkedUploadState::Uploading->value,
            ChunkedUploadInterface::ATTR_EXPIRES_AT         => $now->addHours(24),
            ChunkedUploadInterface::ATTR_INITIATED_AT       => $now,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (): array => [
            ChunkedUploadInterface::ATTR_STATE         => ChunkedUploadState::Completed->value,
            ChunkedUploadInterface::ATTR_FINALIZED_AT  => \Carbon\CarbonImmutable::now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (): array => [
            ChunkedUploadInterface::ATTR_STATE      => ChunkedUploadState::Expired->value,
            ChunkedUploadInterface::ATTR_EXPIRES_AT => \Carbon\CarbonImmutable::now()->subHour(),
        ]);
    }
}
