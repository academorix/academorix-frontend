<?php

declare(strict_types=1);

namespace Academorix\SportsRegistrationsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsRegistrationsSdk\Data\RegistrationTaskData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `registration-tasks` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/RegistrationTasks/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
final readonly class RegistrationTasksResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
