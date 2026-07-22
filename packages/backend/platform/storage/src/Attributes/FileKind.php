<?php

declare(strict_types=1);

namespace Stackra\Storage\Attributes;

use Attribute;

/**
 * Registers a file-kind config recipe with
 * {@see \Stackra\Storage\Contracts\Registry\FileKindRegistryInterface}.
 *
 * Not the same as the {@see \Stackra\Storage\Enums\FileKind}
 * enum — the enum is the shipped taxonomy, this attribute defines
 * a runtime recipe (max size, allowed MIMEs, variants, retention).
 *
 * Scanned at boot by the framework's generic
 * {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * — every class carrying `#[FileKind]` is pushed through
 * {@see \Stackra\Storage\Contracts\Registry\FileKindRegistryInterface::register()}
 * via the `#[HydratesFrom(FileKind::class)]` declaration on that
 * method.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final readonly class FileKind
{
    /**
     * @param  string             $key               Stable kind identifier (matches column `files.kind`).
     * @param  int                $maxSizeMb         Upload cap in megabytes.
     * @param  array<int, string> $allowedMimes      Sniffed-MIME allow-list.
     * @param  array<int, string> $generatesVariants Variant recipe keys.
     * @param  bool               $requiresVirusScan Force antivirus scan for uploads of this kind.
     * @param  bool               $dedupable         Participate in content-addressable dedup.
     * @param  string|null        $disk              Preferred filesystem disk; falls back to `config('storage.disks.per_kind.*')`.
     */
    public function __construct(
        public string $key,
        public int $maxSizeMb,
        public array $allowedMimes,
        public array $generatesVariants = [],
        public bool $requiresVirusScan = true,
        public bool $dedupable = true,
        public ?string $disk = null,
    ) {
    }
}
