<?php

declare(strict_types=1);

namespace Academorix\Storage\Observers;

use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Contracts\Services\ContentAddressableStoreInterface;
use Academorix\Storage\Enums\FileVisibility;
use Academorix\Storage\Enums\VirusScanState;
use Academorix\Storage\Events\FileErased;
use Academorix\Storage\Events\FileUploaded;
use Academorix\Storage\Events\FileUploading;
use Academorix\Storage\Jobs\GenerateFileVariantsJob;
use Academorix\Storage\Jobs\ScanFileForVirusesJob;
use Academorix\Storage\Models\File;

/**
 * Lifecycle side effects on {@see File}.
 *
 * ## Responsibilities
 *
 *   - `creating` — seed defaults (visibility, virus-scan state,
 *     `generated_variant_keys`), fire {@see FileUploading}.
 *   - `created`  — fire {@see FileUploaded}, dispatch
 *     {@see ScanFileForVirusesJob} and — if the row's kind requests
 *     variants — {@see GenerateFileVariantsJob}.
 *   - `deleting` — decrement the content-addressable refcount on
 *     the shared blob; when zero, the store deletes the physical
 *     bytes.
 *   - `deleted`  — fire {@see FileErased}.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class FileObserver
{
    public function __construct(
        private readonly ContentAddressableStoreInterface $blobs,
    ) {
    }

    /**
     * `creating` — apply defaults and fire the in-transaction event
     * so listeners can reject the write.
     */
    public function creating(File $file): void
    {
        if ($file->{FileInterface::ATTR_VISIBILITY} === null) {
            $file->{FileInterface::ATTR_VISIBILITY} = FileVisibility::Private;
        }

        if ($file->{FileInterface::ATTR_VIRUS_SCAN_STATE} === null) {
            $file->{FileInterface::ATTR_VIRUS_SCAN_STATE} = VirusScanState::Pending;
        }

        if ($file->{FileInterface::ATTR_GENERATED_VARIANTS} === null) {
            $file->{FileInterface::ATTR_GENERATED_VARIANTS} = [];
        }

        if ($file->{FileInterface::ATTR_REFERENCE_COUNT} === null) {
            $file->{FileInterface::ATTR_REFERENCE_COUNT} = 1;
        }

        FileUploading::dispatch($file);
    }

    /**
     * `created` — emit `FileUploaded` and dispatch the antivirus +
     * variants jobs.
     */
    public function created(File $file): void
    {
        FileUploaded::dispatch($file);

        // Antivirus scan runs on every upload unless the config
        // disables it globally — the module boots with the scanner
        // enabled by default.
        if ((bool) \config('storage.antivirus.enabled', true)) {
            ScanFileForVirusesJob::dispatch((string) $file->getKey());
        } else {
            // Consumer opted out — mark clean synchronously so
            // reads can proceed.
            $file->update([
                FileInterface::ATTR_VIRUS_SCAN_STATE => VirusScanState::Clean->value,
                FileInterface::ATTR_SCANNED_AT       => \now(),
            ]);
        }

        // Variants are async — the job runs the recipes registered
        // on the file's kind. When no recipes apply (audio without
        // waveform, etc.) the job no-ops.
        GenerateFileVariantsJob::dispatch((string) $file->getKey());
    }

    /**
     * `deleting` — decrement the shared blob's refcount.
     *
     * `deleting` fires for BOTH soft-delete and hard-delete under
     * Eloquent's SoftDeletes trait. We only decrement on hard-delete
     * (i.e. when the model is actually going away) — soft-delete
     * keeps the row + the physical bytes so restore() works.
     */
    public function deleting(File $file): void
    {
        if (! $file->isForceDeleting()) {
            return;
        }

        $sha = (string) $file->{FileInterface::ATTR_SHA256};
        if ($sha === '') {
            return;
        }

        // fail-soft — a missing blob doesn't block the row delete.
        try {
            $this->blobs->decrementReference($sha);
        } catch (\Throwable) {
            // swallow — observed at monitoring, doesn't need to be
            // fatal to a delete.
        }
    }

    /**
     * `deleted` — emit `FileErased`.
     */
    public function deleted(File $file): void
    {
        if (! $file->isForceDeleting()) {
            return;
        }

        FileErased::dispatch(
            (string) $file->getKey(),
            (string) $file->{FileInterface::ATTR_TENANT_ID},
            (string) $file->{FileInterface::ATTR_SHA256},
        );
    }
}
