<?php

declare(strict_types=1);

namespace Stackra\SportsSeasonSdk\Requests\Seasons;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\SportsSeasonSdk\Data\SeasonData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/seasons/{season}` — show one Season.
 *
 * @category SeasonSdk
 *
 * @since    0.1.0
 */
final class ShowSeasonRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $season                 Path parameter — season.
     */
    public function __construct(
        public readonly string $season,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/seasons/' . rawurlencode($this->season);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see SeasonData}.
     */
    public function createDtoFromResponse(Response $response): SeasonData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return SeasonData::from($body);
    }
}
