<?php

declare(strict_types=1);

namespace Stackra\SportsRegistrationsSdk\Requests\Offers;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\SportsRegistrationsSdk\Data\OfferData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/offers/{offer}` — show one Offer.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
final class ShowOfferRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $offer                  Path parameter — offer.
     */
    public function __construct(
        public readonly string $offer,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/offers/' . rawurlencode($this->offer);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see OfferData}.
     */
    public function createDtoFromResponse(Response $response): OfferData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return OfferData::from($body);
    }
}
