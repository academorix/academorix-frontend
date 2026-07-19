<?php

declare(strict_types=1);

namespace Academorix\SportsMedicalSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsMedicalSdk\Data\InjuryData;
use Academorix\SportsMedicalSdk\Requests\Injuries\InjuriesInjuryRequest;
use Academorix\SportsMedicalSdk\Requests\Injuries\ListInjuriesAdminRequest;
use Academorix\SportsMedicalSdk\Requests\Injuries\ShowInjuryRequest;
use Academorix\SportsMedicalSdk\Requests\Injuries\UpdateInjuryRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `injuries` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Injuries/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category MedicalSdk
 *
 * @since    0.1.0
 */
final readonly class InjuriesResource
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
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return mixed
     */
    public function injuries(string $athlete, ?string $idempotencyKey = null): mixed
    {
        return $this->connector->send(new InjuriesInjuryRequest($athlete, $idempotencyKey))->dto();
    }


    /**
     * Show one injury.
     *
     * @param  string  $injury                 Path parameter — injury.
     *
     * @return InjuryData
     */
    public function show(string $injury): InjuryData
    {
        return $this->connector->send(new ShowInjuryRequest($injury))->dto();
    }


    /**
     * Update one injury.
     *
     * @param  string  $injury                 Path parameter — injury.
     * @param  UpdateInjuryPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return InjuryData
     */
    public function update(string $injury, \Academorix\SportsMedicalSdk\Payloads\Injuries\UpdateInjuryPayload $payload, ?string $idempotencyKey = null): InjuryData
    {
        return $this->connector->send(new UpdateInjuryRequest($injury, $payload, $idempotencyKey))->dto();
    }


    /**
     * List every injury.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<InjuryData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListInjuriesAdminRequest($page, $perPage))->dto();
    }
}
