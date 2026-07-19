<?php

declare(strict_types=1);

namespace Academorix\PlatformAdminConsoleSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\PlatformAdminConsoleSdk\Data\AdminDashboardConfigData;
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
