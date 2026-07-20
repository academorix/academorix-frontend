<?php

declare(strict_types=1);

namespace Academorix\SportsMedicalSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsMedicalSdk\Data\AllergyData;
use Academorix\SportsMedicalSdk\Requests\Allergies\AllergiesAllergyRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `allergies` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Allergies/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category MedicalSdk
 *
 * @since    0.1.0
 */
final readonly class AllergiesResource
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
    public function allergies(string $athlete): mixed
    {
        return $this->connector->send(new AllergiesAllergyRequest($athlete))->dto();
    }


    /**
     * Custom — custom endpoint (hand-implement).
     *
     * @param  string  $athlete                Path parameter — athlete.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return mixed
     */
    public function allergies(string $athlete, ?string $idempotencyKey = null): mixed
    {
        return $this->connector->send(new AllergiesAllergyRequest($athlete, $idempotencyKey))->dto();
    }
}
