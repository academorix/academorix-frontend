<?php

declare(strict_types=1);

namespace Academorix\NotificationsAnnouncementsSdk\Requests\Announcements;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\NotificationsAnnouncementsSdk\Data\AnnouncementData;
use Academorix\NotificationsAnnouncementsSdk\Payloads\Announcements\CreateAnnouncementPayload;
use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Response;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `POST /api/v1/announcements` — create a Announcement.
 *
 * @category AnnouncementsSdk
 *
 * @since    0.1.0
 */
final class CreateAnnouncementRequest extends BaseSdkRequest implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     */
    protected Method $method = Method::POST;

    /**
     * @param  CreateAnnouncementPayload        $payload         Validated payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function __construct(
        public readonly CreateAnnouncementPayload $payload,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/announcements';
    }

    /**
     * Serialise the payload into the JSON body. Spatie Data's
     * `toArray()` strips any `Optional` sentinel values, so the
     * server only sees fields the caller explicitly set.
     *
     * @return array<string, mixed>
     */
    protected function defaultBody(): array
    {
        return $this->payload->toArray();
    }

    /**
     * Attach the caller-supplied idempotency key when one was provided.
     *
     * @return array<string, string>
     */
    protected function defaultHeaders(): array
    {
        return $this->idempotencyKey !== null
            ? ['Idempotency-Key' => $this->idempotencyKey]
            : [];
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
