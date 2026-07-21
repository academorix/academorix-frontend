<?php

declare(strict_types=1);

namespace Stackra\SportsRegistrationsSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsRegistrationsSdk\Data\RegistrationData;
use Stackra\SportsRegistrationsSdk\Requests\Registrations\CreateRegistrationRequest;
use Stackra\SportsRegistrationsSdk\Requests\Registrations\ListRegistrationsRequest;
use Stackra\SportsRegistrationsSdk\Requests\Registrations\ShowRegistrationRequest;
use Stackra\SportsRegistrationsSdk\Requests\Registrations\UpdateRegistrationRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `registrations` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Registrations/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
final readonly class RegistrationsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every registration.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<RegistrationData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListRegistrationsRequest($page, $perPage))->dto();
    }


    /**
     * Create a registration.
     *
     * @param  CreateRegistrationPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return RegistrationData
     */
    public function create(\Stackra\SportsRegistrationsSdk\Payloads\Registrations\CreateRegistrationPayload $payload, ?string $idempotencyKey = null): RegistrationData
    {
        return $this->connector->send(new CreateRegistrationRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one registration.
     *
     * @param  string  $registration           Path parameter — registration.
     *
     * @return RegistrationData
     */
    public function show(string $registration): RegistrationData
    {
        return $this->connector->send(new ShowRegistrationRequest($registration))->dto();
    }


    /**
     * Update one registration.
     *
     * @param  string  $registration           Path parameter — registration.
     * @param  UpdateRegistrationPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return RegistrationData
     */
    public function update(string $registration, \Stackra\SportsRegistrationsSdk\Payloads\Registrations\UpdateRegistrationPayload $payload, ?string $idempotencyKey = null): RegistrationData
    {
        return $this->connector->send(new UpdateRegistrationRequest($registration, $payload, $idempotencyKey))->dto();
    }


    /**
     * Create a registration.
     *
     * @param  CreateRegistrationPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return RegistrationData
     */
    public function create(\Stackra\SportsRegistrationsSdk\Payloads\Registrations\CreateRegistrationPayload $payload, ?string $idempotencyKey = null): RegistrationData
    {
        return $this->connector->send(new CreateRegistrationRequest($payload, $idempotencyKey))->dto();
    }
}
