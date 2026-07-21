<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk\Requests\ProgressCards;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\SportsProgressSdk\Data\ProgressCardData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/progress-cards/{card}` — show one ProgressCard.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
final class ShowProgressCardRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $card                   Path parameter — card.
     */
    public function __construct(
        public readonly string $card,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/progress-cards/' . rawurlencode($this->card);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see ProgressCardData}.
     */
    public function createDtoFromResponse(Response $response): ProgressCardData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return ProgressCardData::from($body);
    }
}
