<?php

declare(strict_types=1);

namespace Stackra\SharedOfflineSyncSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `offline-sync` module.
 *
 * Registered under `#[AsSdkResource(name: 'offline-sync', service: 'shared')]`
 * so the Shared service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->offlineSync()->...`.
 *
 * ## Peer Resources
 *
 * - SyncCursorsResource — peer resource for `sync-cursors`.
 *
 * @category OfflineSyncSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'offline-sync', service: 'shared')]
final class OfflineSyncSdkResource extends BaseSdkResource
{
    private ?Resources\SyncCursorsResource $syncCursors = null;

    /**
     * Access SyncCursors peer Resource.
     */
    public function syncCursors(): Resources\SyncCursorsResource
    {
        return $this->syncCursors ??= new Resources\SyncCursorsResource($this->connector);
    }
}
