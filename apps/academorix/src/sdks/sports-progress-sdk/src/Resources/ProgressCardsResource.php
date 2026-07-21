<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsProgressSdk\Data\ProgressCardData;
use Stackra\SportsProgressSdk\Requests\ProgressCards\ShowProgressCardRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `progress-cards` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/ProgressCards/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
final readonly class ProgressCardsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * Show one progresscard.
     *
     * @param  string  $card                   Path parameter — card.
     *
     * @return ProgressCardData
     */
    public function show(string $card): ProgressCardData
    {
        return $this->connector->send(new ShowProgressCardRequest($card))->dto();
    }


    /**
     * Show one progresscard.
     *
     * @param  string  $signature              Path parameter — signature.
     *
     * @return ProgressCardData
     */
    public function show(string $signature): ProgressCardData
    {
        return $this->connector->send(new ShowProgressCardRequest($signature))->dto();
    }
}
