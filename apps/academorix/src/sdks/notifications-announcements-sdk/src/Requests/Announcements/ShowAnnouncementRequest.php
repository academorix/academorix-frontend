<?php

declare(strict_types=1);

namespace Stackra\NotificationsAnnouncementsSdk\Requests\Announcements;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\NotificationsAnnouncementsSdk\Data\AnnouncementData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/announcements/{announcement}` — show one Announcement.
 *
 * @category AnnouncementsSdk
 *
 * @since    0.1.0
 */
final class ShowAnnouncementRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $announcement           Path parameter — announcement.
     */
    public function __construct(
        public readonly string $announcement,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/announcements/' . rawurlencode($this->announcement);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see AnnouncementData}.
     */
    public function createDtoFromResponse(Response $response): AnnouncementData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return AnnouncementData::from($body);
    }
}
