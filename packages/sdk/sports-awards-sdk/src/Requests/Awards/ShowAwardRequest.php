<?php

declare(strict_types=1);

namespace Academorix\SportsAwardsSdk\Requests\Awards;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\SportsAwardsSdk\Data\AwardData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/awards/{award}` — show one Award.
 *
 * @category AwardsSdk
 *
 * @since    0.1.0
 */
final class ShowAwardRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $award                  Path parameter — award.
     */
    public function __construct(
        public readonly string $award,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/awards/' . rawurlencode($this->award);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see AwardData}.
     */
    public function createDtoFromResponse(Response $response): AwardData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return AwardData::from($body);
    }
}
