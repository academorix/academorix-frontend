<?php

declare(strict_types=1);

namespace Academorix\Storage\Observers;

use Academorix\Storage\Contracts\Data\ChunkedUploadInterface;
use Academorix\Storage\Contracts\Services\ChunkedUploadCoordinatorInterface;
use Academorix\Storage\Enums\ChunkedUploadState;
use Academorix\Storage\Models\ChunkedUpload;

/**
 * Lifecycle side effects on {@see ChunkedUpload}.
 *
 *   - `creating` — default `state = initiating` when unset.
 *   - `deleting` — when the row is in an in-flight state, ask the
 *     coordinator to abort on the provider side before the row
 *     goes away.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class ChunkedUploadObserver
{
    public function __construct(
        private readonly ChunkedUploadCoordinatorInterface $coordinator,
    ) {
    }

    /**
     * `creating` — apply defaults.
     */
    public function creating(ChunkedUpload $upload): void
    {
        if ($upload->{ChunkedUploadInterface::ATTR_STATE} === null) {
            $upload->{ChunkedUploadInterface::ATTR_STATE} = ChunkedUploadState::Initiating;
        }

        if ($upload->{ChunkedUploadInterface::ATTR_CHUNKS} === null) {
            $upload->{ChunkedUploadInterface::ATTR_CHUNKS} = [];
        }

        if ($upload->{ChunkedUploadInterface::ATTR_UPLOADED_BYTES} === null) {
            $upload->{ChunkedUploadInterface::ATTR_UPLOADED_BYTES} = 0;
        }
    }

    /**
     * `deleting` — abort the provider-side multipart handle when
     * the row is still in flight.
     */
    public function deleting(ChunkedUpload $upload): void
    {
        $state = $upload->{ChunkedUploadInterface::ATTR_STATE};

        $inFlight = \in_array(
            $state,
            [ChunkedUploadState::Initiating, ChunkedUploadState::Uploading, ChunkedUploadState::Finalizing],
            true,
        );

        if (! $inFlight) {
            return;
        }

        // fail-soft — abort should never block a soft-delete.
        try {
            $this->coordinator->abort($upload, 'row_deleted');
        } catch (\Throwable) {
            // swallow — the retention job will pick it up later.
        }
    }
}
