<?php

declare(strict_types=1);

namespace Stackra\NotificationsAnnouncementsSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\NotificationsAnnouncementsSdk\Data\AnnouncementData;
use Stackra\NotificationsAnnouncementsSdk\Requests\Announcements\CreateAnnouncementRequest;
use Stackra\NotificationsAnnouncementsSdk\Requests\Announcements\ListAnnouncementsRequest;
use Stackra\NotificationsAnnouncementsSdk\Requests\Announcements\ShowAnnouncementRequest;
use Stackra\NotificationsAnnouncementsSdk\Requests\Announcements\UpdateAnnouncementRequest;
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
    public function create(\Stackra\NotificationsAnnouncementsSdk\Payloads\Announcements\CreateAnnouncementPayload $payload, ?string $idempotencyKey = null): AnnouncementData
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
    public function update(string $announcement, \Stackra\NotificationsAnnouncementsSdk\Payloads\Announcements\UpdateAnnouncementPayload $payload, ?string $idempotencyKey = null): AnnouncementData
    {
        return $this->connector->send(new UpdateAnnouncementRequest($announcement, $payload, $idempotencyKey))->dto();
    }
}
