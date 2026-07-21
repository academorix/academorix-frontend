<?php

declare(strict_types=1);

namespace Stackra\PlatformAdminConsoleSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\PlatformAdminConsoleSdk\Data\AdminDashboardConfigData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `admin-dashboard-configs` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/AdminDashboardConfigs/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category AdminConsoleSdk
 *
 * @since    0.1.0
 */
final readonly class AdminDashboardConfigsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
