<?php

declare(strict_types=1);

namespace Academorix\SportsDrillsSdk\Requests\Drills;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\SportsDrillsSdk\Data\DrillData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/drills/{drill}` — show one Drill.
 *
 * @category DrillsSdk
 *
 * @since    0.1.0
 */
final class ShowDrillRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $drill                  Path parameter — drill.
     */
    public function __construct(
        public readonly string $drill,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/drills/' . rawurlencode($this->drill);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see DrillData}.
     */
    public function createDtoFromResponse(Response $response): DrillData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return DrillData::from($body);
    }
}
