<?php

declare(strict_types=1);

namespace Academorix\PlatformAdminConsoleSdk;

use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `admin-console` module.
 *
 * Registered under `#[AsSdkResource(name: 'admin-console', service: 'platform')]`
 * so the Platform service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->adminConsole()->...`.
 *
 * ## Peer Resources
 *
 * - AdminDashboardConfigsResource — peer resource for `admin-dashboard-configs`.
 *
 * @category AdminConsoleSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'admin-console', service: 'platform')]
final class AdminConsoleSdkResource extends BaseSdkResource
{
    private ?Resources\AdminDashboardConfigsResource $adminDashboardConfigs = null;

    /**
     * Access AdminDashboardConfigs peer Resource.
     */
    public function adminDashboardConfigs(): Resources\AdminDashboardConfigsResource
    {
        return $this->adminDashboardConfigs ??= new Resources\AdminDashboardConfigsResource($this->connector);
    }
}
