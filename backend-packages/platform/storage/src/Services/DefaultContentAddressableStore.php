<?php

declare(strict_types=1);

namespace Academorix\Storage\Services;

use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Contracts\Services\ContentAddressableStoreInterface;
use Academorix\Storage\Models\File;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Support\Facades\Storage;

/**
 * Content-addressable blob store backed by Laravel's
 * {@see \Illuminate\Contracts\Filesystem\Filesystem}.
 *
 * Refcount is denormalised on every `File` row (`reference_count`).
 * When two tenants upload identical content, both get a `File` row
 * pointing at the same physical path; the last-referring
 * hard-delete removes the bytes.
 *
 * `#[Singleton]` — the store is stateless per-request; the underlying
 * Laravel disk handles the file I/O. The interface declares the
 * container binding via
 * `#[Bind(DefaultContentAddressableStore::class)]` (Pattern A per
 * `.kiro/steering/php-attributes.md`), so this concrete carries only
 * its lifetime attribute.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultContentAddressableStore implements ContentAddressableStoreInterface
{
    /**
     * {@inheritDoc}
     */
    public function store(string $sha256, $stream, string $disk): string
    {
        // Convention: tenants/{tenant_id}/blobs/{sha[0:2]}/{sha[2:4]}/{sha}
        // The kind + tenant prefix is materialised on the File row's
        // `path` column at write time; the blob itself lives under
        // a tenant-agnostic address so dedup can reach it.
        $prefix = \substr($sha256, 0, 2) . '/' . \substr($sha256, 2, 2);
        $path   = 'blobs/' . $prefix . '/' . $sha256;

        // No-op when the blob is already present — content-addressable
        // storage is idempotent by design.
        if (! Storage::disk($disk)->exists($path)) {
            Storage::disk($disk)->put($path, $stream);
        }

        return $path;
    }

    /**
     * {@inheritDoc}
     */
    public function incrementReference(string $sha256): int
    {
        // Aggregate count across every non-deleted row pointing at
        // this hash. Idempotent — the caller re-reads afterwards.
        return (int) File::query()
            ->where(FileInterface::ATTR_SHA256, $sha256)
            ->count();
    }

    /**
     * {@inheritDoc}
     *
     * Fail-soft — a missing blob is treated as already-removed. The
     * caller (typically the observer) never needs to know the exact
     * cause of a missing physical file.
     */
    public function decrementReference(string $sha256): int
    {
        $remaining = (int) File::query()
            ->where(FileInterface::ATTR_SHA256, $sha256)
            ->count();

        if ($remaining === 0) {
            // Physical delete — sweep every disk once. Real deployments
            // will pin the disk per file kind and only sweep the actual
            // location.
            $prefix = \substr($sha256, 0, 2) . '/' . \substr($sha256, 2, 2);
            $path   = 'blobs/' . $prefix . '/' . $sha256;

            /** @var array<int, string> $disks */
            $disks = \array_values((array) \config('storage.disks.per_kind', []));
            $disks[] = (string) \config('storage.disks.default', 'local');

            foreach (\array_unique($disks) as $disk) {
                try {
                    if (Storage::disk($disk)->exists($path)) {
                        Storage::disk($disk)->delete($path);
                    }
                } catch (\Throwable) {
                    // fail-soft — a broken disk shouldn't crash the
                    // observer during a soft delete.
                }
            }
        }

        return $remaining;
    }

    /**
     * {@inheritDoc}
     *
     * Walks every configured disk under the `blobs/` prefix and
     * counts orphans — physical blobs with no referring File row.
     * When `$dryRun === false` each orphan is physically deleted.
     */
    public function reconcileOrphans(bool $dryRun = false): int
    {
        /** @var array<int, string> $disks */
        $disks = \array_values((array) \config('storage.disks.per_kind', []));
        $disks[] = (string) \config('storage.disks.default', 'local');

        $orphans = 0;
        foreach (\array_unique($disks) as $disk) {
            try {
                $files = Storage::disk($disk)->allFiles('blobs');
            } catch (\Throwable) {
                // fail-soft — a disk may not be reachable in the
                // scanning worker.
                continue;
            }

            foreach ($files as $path) {
                // Extract the sha256 from the path convention
                // `blobs/<aa>/<bb>/<sha>`.
                $sha = \basename($path);
                if (\strlen($sha) !== 64) {
                    continue;
                }

                $count = (int) File::query()
                    ->withoutGlobalScopes()
                    ->where(FileInterface::ATTR_SHA256, $sha)
                    ->count();

                if ($count === 0) {
                    $orphans++;
                    if (! $dryRun) {
                        try {
                            Storage::disk($disk)->delete($path);
                        } catch (\Throwable) {
                            // fail-soft — a broken disk shouldn't
                            // stop the scan.
                        }
                    }
                }
            }
        }

        return $orphans;
    }
}
