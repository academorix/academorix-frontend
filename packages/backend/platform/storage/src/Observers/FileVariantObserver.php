<?php

declare(strict_types=1);

namespace Stackra\Storage\Observers;

use Stackra\Storage\Contracts\Data\FileVariantInterface;
use Stackra\Storage\Events\FileVariantGenerated;
use Stackra\Storage\Models\FileVariant;
use Illuminate\Support\Facades\Storage;

/**
 * Lifecycle side effects on {@see FileVariant}.
 *
 *   - `created` — emit {@see FileVariantGenerated}.
 *   - `deleted` — cascade-cleanup the physical variant bytes on
 *     disk. Variants are regeneratable, so a lost variant is fine —
 *     the delete is fail-soft.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class FileVariantObserver
{
    /**
     * `created` — announce the variant is available.
     */
    public function created(FileVariant $variant): void
    {
        FileVariantGenerated::dispatch($variant);
    }

    /**
     * `deleted` — release the variant's physical bytes.
     */
    public function deleted(FileVariant $variant): void
    {
        $disk = (string) $variant->{FileVariantInterface::ATTR_DISK};
        $path = (string) $variant->{FileVariantInterface::ATTR_PATH};

        // fail-soft — losing a variant is safe (they regenerate).
        try {
            if ($disk !== '' && $path !== '' && Storage::disk($disk)->exists($path)) {
                Storage::disk($disk)->delete($path);
            }
        } catch (\Throwable) {
            // swallow — logged elsewhere.
        }
    }
}
