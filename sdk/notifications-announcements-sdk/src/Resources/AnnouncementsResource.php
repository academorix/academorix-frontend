<?php

declare(strict_types=1);

namespace Academorix\NotificationsAnnouncementsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\NotificationsAnnouncementsSdk\Data\AnnouncementData;
use Academorix\NotificationsAnnouncementsSdk\Requests\Announcements\CreateAnnouncementRequest;
use Academorix\NotificationsAnnouncementsSdk\Requests\Announcements\ListAnnouncementsRequest;
use Academorix\NotificationsAnnouncementsSdk\Requests\Announcements\ShowAnnouncementRequest;
use Academorix\NotificationsAnnouncementsSdk\Requests\Announcements\UpdateAnnouncementRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `announcements` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Announcements/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category AnnouncementsSdk
 *
 * @since    0.1.0
 */
final readonly class AnnouncementsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every announcement.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<AnnouncementData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListAnnouncementsRequest($page, $perPage))->dto();
    }


    /**
     * Create a announcement.
     *
     * @param  CreateAnnouncementPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return AnnouncementData
     */
    public function create(\Academorix\NotificationsAnnouncementsSdk\Payloads\Announcements\CreateAnnouncementPayload $payload, ?string $idempotencyKey = null): AnnouncementData
    {
        return $this->connector->send(new CreateAnnouncementRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one announcement.
     *
     * @param  string  $announcement           Path parameter — announcement.
     *
     * @return AnnouncementData
     */
    public function show(string $announcement): AnnouncementData
    {
        return $this->connector->send(new ShowAnnouncementRequest($announcement))->dto();
    }


    /**
     * Update one announcement.
     *
     * @param  string  $announcement           Path parameter — announcement.
     * @param  UpdateAnnouncementPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return AnnouncementData
     */
    public function update(string $announcement, \Academorix\NotificationsAnnouncementsSdk\Payloads\Announcements\UpdateAnnouncementPayload $payload, ?string $idempotencyKey = null): AnnouncementData
    {
        return $this->connector->send(new UpdateAnnouncementRequest($announcement, $payload, $idempotencyKey))->dto();
    }
}
