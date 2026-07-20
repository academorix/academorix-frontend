<?php

declare(strict_types=1);

namespace Academorix\SportsDevelopmentSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsDevelopmentSdk\Data\TalentFlagData;
use Academorix\SportsDevelopmentSdk\Requests\TalentFlags\CreateTalentFlagRequest;
use Academorix\SportsDevelopmentSdk\Requests\TalentFlags\ListTalentFlagsRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `talent-flags` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/TalentFlags/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category DevelopmentSdk
 *
 * @since    0.1.0
 */
final readonly class TalentFlagsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every talentflag.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<TalentFlagData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListTalentFlagsRequest($page, $perPage))->dto();
    }


    /**
     * Create a talentflag.
     *
     * @param  CreateTalentFlagPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return TalentFlagData
     */
    public function create(\Academorix\SportsDevelopmentSdk\Payloads\TalentFlags\CreateTalentFlagPayload $payload, ?string $idempotencyKey = null): TalentFlagData
    {
        return $this->connector->send(new CreateTalentFlagRequest($payload, $idempotencyKey))->dto();
    }
}
