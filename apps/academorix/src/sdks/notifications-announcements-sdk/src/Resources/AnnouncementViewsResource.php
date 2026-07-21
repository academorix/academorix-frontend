<?php

declare(strict_types=1);

namespace Stackra\NotificationsAnnouncementsSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\NotificationsAnnouncementsSdk\Data\AnnouncementViewData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `announcement-views` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/AnnouncementViews/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category AnnouncementsSdk
 *
 * @since    0.1.0
 */
final readonly class AnnouncementViewsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
