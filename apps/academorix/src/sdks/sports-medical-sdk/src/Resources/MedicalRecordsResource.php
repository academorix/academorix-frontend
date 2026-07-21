<?php

declare(strict_types=1);

namespace Stackra\SportsMedicalSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsMedicalSdk\Data\MedicalRecordData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `medical-records` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/MedicalRecords/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category MedicalSdk
 *
 * @since    0.1.0
 */
final readonly class MedicalRecordsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
