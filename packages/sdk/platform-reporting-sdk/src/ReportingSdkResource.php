<?php

declare(strict_types=1);

namespace Academorix\PlatformReportingSdk;

use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `reporting` module.
 *
 * Registered under `#[AsSdkResource(name: 'reporting', service: 'platform')]`
 * so the Platform service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->reporting()->...`.
 *
 * ## Peer Resources
 *
 * - DashboardsResource — peer resource for `dashboards`.
 * - ReportDefinitionsResource — peer resource for `report-definitions`.
 * - ReportRunsResource — peer resource for `report-runs`.
 * - SavedReportsResource — peer resource for `saved-reports`.
 *
 * @category ReportingSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'reporting', service: 'platform')]
final class ReportingSdkResource extends BaseSdkResource
{
    private ?Resources\DashboardsResource $dashboards = null;
    private ?Resources\ReportDefinitionsResource $reportDefinitions = null;
    private ?Resources\ReportRunsResource $reportRuns = null;
    private ?Resources\SavedReportsResource $savedReports = null;

    /**
     * Access Dashboards peer Resource.
     */
    public function dashboards(): Resources\DashboardsResource
    {
        return $this->dashboards ??= new Resources\DashboardsResource($this->connector);
    }

    /**
     * Access ReportDefinitions peer Resource.
     */
    public function reportDefinitions(): Resources\ReportDefinitionsResource
    {
        return $this->reportDefinitions ??= new Resources\ReportDefinitionsResource($this->connector);
    }

    /**
     * Access ReportRuns peer Resource.
     */
    public function reportRuns(): Resources\ReportRunsResource
    {
        return $this->reportRuns ??= new Resources\ReportRunsResource($this->connector);
    }

    /**
     * Access SavedReports peer Resource.
     */
    public function savedReports(): Resources\SavedReportsResource
    {
        return $this->savedReports ??= new Resources\SavedReportsResource($this->connector);
    }
}
