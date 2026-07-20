<?php

declare(strict_types=1);

namespace Academorix\SharedOfflineSyncSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SharedOfflineSyncSdk\Data\SyncCursorData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `sync-cursors` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/SyncCursors/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category OfflineSyncSdk
 *
 * @since    0.1.0
 */
final readonly class SyncCursorsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
