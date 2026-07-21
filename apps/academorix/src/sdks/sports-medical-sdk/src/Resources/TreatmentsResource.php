<?php

declare(strict_types=1);

namespace Stackra\SportsMedicalSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsMedicalSdk\Data\TreatmentData;
use Stackra\SportsMedicalSdk\Requests\Treatments\TreatmentsTreatmentRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `treatments` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Treatments/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category MedicalSdk
 *
 * @since    0.1.0
 */
final readonly class TreatmentsResource
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
     * @param  string  $injury                 Path parameter — injury.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return mixed
     */
    public function treatments(string $injury, ?string $idempotencyKey = null): mixed
    {
        return $this->connector->send(new TreatmentsTreatmentRequest($injury, $idempotencyKey))->dto();
    }
}
