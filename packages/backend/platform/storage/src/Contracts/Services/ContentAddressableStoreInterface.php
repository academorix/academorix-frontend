<?php

declare(strict_types=1);

namespace Stackra\Storage\Contracts\Services;

use Stackra\Storage\Services\DefaultContentAddressableStore;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the content-addressable blob store.
 *
 * Every uploaded byte-stream is stored under its SHA-256 hash so
 * two tenants uploading identical content share the physical blob.
 * The refcount on the shared blob is managed here — physical delete
 * fires when the last-referring `File` row is hard-deleted.
 *
 * `#[Bind(DefaultContentAddressableStore::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". The
 * interface owns the wiring; the concrete stays free of the binding
 * attribute and only carries its lifetime attribute (`#[Singleton]`).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(DefaultContentAddressableStore::class)]
interface ContentAddressableStoreInterface
{
    /**
     * Persist a byte-stream keyed by its SHA-256.
     *
     * @param  string    $sha256  Hex-encoded SHA-256 of the stream.
     * @param  resource  $stream  PHP stream resource.
     * @param  string    $disk    Target filesystem disk.
     * @return string    Storage path the blob was persisted under.
     *                   No-ops (returns existing path) when the
     *                   hash is already present.
     */
    public function store(string $sha256, $stream, string $disk): string;

    /**
     * Bump the refcount on a shared blob.
     *
     * @return int  New refcount value.
     */
    public function incrementReference(string $sha256): int;

    /**
     * Decrement the refcount on a shared blob. When the refcount
     * hits zero, the physical bytes are deleted.
     *
     * @return int  New refcount value (zero after deletion).
     */
    public function decrementReference(string $sha256): int;

    /**
     * Walk every stored blob and reconcile it against the current
     * File rows. Blobs with zero referring rows are deleted (or
     * counted, when `$dryRun` is true).
     *
     * Invoked by
     * {@see \Stackra\Storage\Jobs\DedupOrphanBlobsJob}.
     *
     * @return int  Number of orphan blobs found (deleted, or
     *              would-be-deleted under `$dryRun`).
     */
    public function reconcileOrphans(bool $dryRun = false): int;
}
