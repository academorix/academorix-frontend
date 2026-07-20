<?php

declare(strict_types=1);

namespace Academorix\SportsMedicalSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsMedicalSdk\Data\MedicalClearanceData;
use Academorix\SportsMedicalSdk\Requests\MedicalClearances\CreateMedicalClearanceRequest;
use Academorix\SportsMedicalSdk\Requests\MedicalClearances\ListMedicalClearancesRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `medical-clearances` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/MedicalClearances/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category MedicalSdk
 *
 * @since    0.1.0
 */
final readonly class MedicalClearancesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every medicalclearance.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<MedicalClearanceData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListMedicalClearancesRequest($page, $perPage))->dto();
    }


    /**
     * Create a medicalclearance.
     *
     * @param  CreateMedicalClearancePayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return MedicalClearanceData
     */
    public function create(\Academorix\SportsMedicalSdk\Payloads\MedicalClearances\CreateMedicalClearancePayload $payload, ?string $idempotencyKey = null): MedicalClearanceData
    {
        return $this->connector->send(new CreateMedicalClearanceRequest($payload, $idempotencyKey))->dto();
    }
}
