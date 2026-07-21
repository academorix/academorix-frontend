<?php

declare(strict_types=1);

namespace Stackra\SportsDevelopmentSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `development` module.
 *
 * Registered under `#[AsSdkResource(name: 'development', service: 'sports')]`
 * so the Sports service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->development()->...`.
 *
 * ## Peer Resources
 *
 * - DevelopmentPathwaiesResource — peer resource for `development-pathwaies`.
 * - GoalsResource — peer resource for `goals`.
 * - PathwayStagesResource — peer resource for `pathway-stages`.
 * - ScoutingReportsResource — peer resource for `scouting-reports`.
 * - TalentFlagsResource — peer resource for `talent-flags`.
 *
 * @category DevelopmentSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'development', service: 'sports')]
final class DevelopmentSdkResource extends BaseSdkResource
{
    private ?Resources\DevelopmentPathwaiesResource $developmentPathwaies = null;
    private ?Resources\GoalsResource $goals = null;
    private ?Resources\PathwayStagesResource $pathwayStages = null;
    private ?Resources\ScoutingReportsResource $scoutingReports = null;
    private ?Resources\TalentFlagsResource $talentFlags = null;

    /**
     * Access DevelopmentPathwaies peer Resource.
     */
    public function developmentPathwaies(): Resources\DevelopmentPathwaiesResource
    {
        return $this->developmentPathwaies ??= new Resources\DevelopmentPathwaiesResource($this->connector);
    }

    /**
     * Access Goals peer Resource.
     */
    public function goals(): Resources\GoalsResource
    {
        return $this->goals ??= new Resources\GoalsResource($this->connector);
    }

    /**
     * Access PathwayStages peer Resource.
     */
    public function pathwayStages(): Resources\PathwayStagesResource
    {
        return $this->pathwayStages ??= new Resources\PathwayStagesResource($this->connector);
    }

    /**
     * Access ScoutingReports peer Resource.
     */
    public function scoutingReports(): Resources\ScoutingReportsResource
    {
        return $this->scoutingReports ??= new Resources\ScoutingReportsResource($this->connector);
    }

    /**
     * Access TalentFlags peer Resource.
     */
    public function talentFlags(): Resources\TalentFlagsResource
    {
        return $this->talentFlags ??= new Resources\TalentFlagsResource($this->connector);
    }
}
