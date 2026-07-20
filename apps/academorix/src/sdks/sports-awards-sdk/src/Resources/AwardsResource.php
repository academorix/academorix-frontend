<?php

declare(strict_types=1);

namespace Academorix\SportsAwardsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsAwardsSdk\Data\AwardData;
use Academorix\SportsAwardsSdk\Requests\Awards\AwardsAwardRequest;
use Academorix\SportsAwardsSdk\Requests\Awards\CreateAwardRequest;
use Academorix\SportsAwardsSdk\Requests\Awards\ShowAwardRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `awards` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Awards/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category AwardsSdk
 *
 * @since    0.1.0
 */
final readonly class AwardsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * Custom — custom endpoint (hand-implement).
     *
     * @param  string  $athlete                Path parameter — athlete.
     *
     * @return mixed
     */
    public function awards(string $athlete): mixed
    {
        return $this->connector->send(new AwardsAwardRequest($athlete))->dto();
    }


    /**
     * Create a award.
     *
     * @param  CreateAwardPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return AwardData
     */
    public function create(\Academorix\SportsAwardsSdk\Payloads\Awards\CreateAwardPayload $payload, ?string $idempotencyKey = null): AwardData
    {
        return $this->connector->send(new CreateAwardRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one award.
     *
     * @param  string  $award                  Path parameter — award.
     *
     * @return AwardData
     */
    public function show(string $award): AwardData
    {
        return $this->connector->send(new ShowAwardRequest($award))->dto();
    }
}
