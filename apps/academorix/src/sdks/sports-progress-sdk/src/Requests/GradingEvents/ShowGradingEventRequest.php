<?php

declare(strict_types=1);

namespace Academorix\SportsProgressSdk\Requests\GradingEvents;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\SportsProgressSdk\Data\GradingEventData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/grading-events/{event}` — show one GradingEvent.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
final class ShowGradingEventRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $event                  Path parameter — event.
     */
    public function __construct(
        public readonly string $event,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/grading-events/' . rawurlencode($this->event);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see GradingEventData}.
     */
    public function createDtoFromResponse(Response $response): GradingEventData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return GradingEventData::from($body);
    }
}
