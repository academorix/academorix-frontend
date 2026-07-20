<?php

declare(strict_types=1);

namespace Academorix\SportsRegistrationsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsRegistrationsSdk\Data\OfferData;
use Academorix\SportsRegistrationsSdk\Requests\Offers\ListOffersRequest;
use Academorix\SportsRegistrationsSdk\Requests\Offers\ShowOfferRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `offers` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Offers/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
final readonly class OffersResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every offer.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<OfferData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListOffersRequest($page, $perPage))->dto();
    }


    /**
     * Show one offer.
     *
     * @param  string  $offer                  Path parameter — offer.
     *
     * @return OfferData
     */
    public function show(string $offer): OfferData
    {
        return $this->connector->send(new ShowOfferRequest($offer))->dto();
    }


    /**
     * Show one offer.
     *
     * @param  string  $signature              Path parameter — signature.
     *
     * @return OfferData
     */
    public function show(string $signature): OfferData
    {
        return $this->connector->send(new ShowOfferRequest($signature))->dto();
    }
}
