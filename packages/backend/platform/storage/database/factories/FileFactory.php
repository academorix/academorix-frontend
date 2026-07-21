<?php

declare(strict_types=1);

namespace Stackra\Storage\Database\Factories;

use Stackra\Storage\Contracts\Data\FileInterface;
use Stackra\Storage\Enums\FileKind as FileKindEnum;
use Stackra\Storage\Enums\FileVisibility;
use Stackra\Storage\Enums\VirusScanState;
use Stackra\Storage\Models\File;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see File}.
 *
 * Default state: a document with `virus_scan_state = clean`. States
 * cover `image()`, `quarantined()`, `withKind()`.
 *
 * @extends Factory<File>
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class FileFactory extends Factory
{
    /**
     * @var class-string<File>
     */
    protected $model = File::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $filename = 'sample-' . Str::random(6) . '.pdf';
        $sha256   = \hash('sha256', $filename . \microtime(true));

        return [
            FileInterface::ATTR_ID                  => 'fil_' . Str::ulid()->toBase32(),
            FileInterface::ATTR_TENANT_ID           => 'ten_' . Str::ulid()->toBase32(),
            FileInterface::ATTR_OWNER_ID            => 'usr_' . Str::ulid()->toBase32(),
            FileInterface::ATTR_KIND                => FileKindEnum::Document->value,
            FileInterface::ATTR_COLLECTION          => 'default',
            FileInterface::ATTR_FILENAME            => $filename,
            FileInterface::ATTR_NAME                => $filename,
            FileInterface::ATTR_MIME_TYPE           => 'application/pdf',
            FileInterface::ATTR_SIZE_BYTES          => \random_int(1_000, 5_000_000),
            FileInterface::ATTR_SHA256              => $sha256,
            FileInterface::ATTR_DISK                => 'local',
            FileInterface::ATTR_PATH                => 'tenants/tenant/document/' . \substr($sha256, 0, 2) . '/' . \substr($sha256, 2, 2) . '/' . $sha256 . '.pdf',
            FileInterface::ATTR_VISIBILITY          => FileVisibility::Private->value,
            FileInterface::ATTR_VIRUS_SCAN_STATE    => VirusScanState::Clean->value,
            FileInterface::ATTR_DEDUPABLE           => true,
            FileInterface::ATTR_REFERENCE_COUNT     => 1,
            FileInterface::ATTR_GENERATED_VARIANTS  => [],
            FileInterface::ATTR_IS_SYSTEM           => false,
        ];
    }

    public function image(): static
    {
        return $this->state(fn (): array => [
            FileInterface::ATTR_KIND      => FileKindEnum::Image->value,
            FileInterface::ATTR_MIME_TYPE => 'image/jpeg',
            FileInterface::ATTR_FILENAME  => 'photo-' . Str::random(6) . '.jpg',
        ]);
    }

    public function quarantined(): static
    {
        return $this->state(fn (): array => [
            FileInterface::ATTR_VIRUS_SCAN_STATE   => VirusScanState::Quarantined->value,
            FileInterface::ATTR_VIRUS_SCAN_DETAILS => ['signature' => 'Eicar-Test-Signature'],
            FileInterface::ATTR_SCANNED_AT         => \Carbon\CarbonImmutable::now(),
        ]);
    }

    public function withKind(FileKindEnum $kind): static
    {
        return $this->state(fn (): array => [
            FileInterface::ATTR_KIND => $kind->value,
        ]);
    }
}
