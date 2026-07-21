<?php

declare(strict_types=1);

namespace Stackra\PlatformCredentialsSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformCredentialsSdk\Data\CheckinLogData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `checkin-logs` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/CheckinLogs/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category CredentialsSdk
 *
 * @since    0.1.0
 */
final readonly class CheckinLogsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
