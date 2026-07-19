<?php

declare(strict_types=1);

namespace Academorix\SportsCompetitionSdk;

use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `competition` module.
 *
 * Registered under `#[AsSdkResource(name: 'competition', service: 'sports')]`
 * so the Sports service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->competition()->...`.
 *
 * ## Peer Resources
 *
 * - BracketNodesResource — peer resource for `bracket-nodes`.
 * - CompetitionFixturesResource — peer resource for `competition-fixtures`.
 * - CompetitionTeamsResource — peer resource for `competition-teams`.
 * - CompetitionsResource — peer resource for `competitions`.
 * - StandingRowsResource — peer resource for `standing-rows`.
 *
 * @category CompetitionSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'competition', service: 'sports')]
final class CompetitionSdkResource extends BaseSdkResource
{
    private ?Resources\BracketNodesResource $bracketNodes = null;
    private ?Resources\CompetitionFixturesResource $competitionFixtures = null;
    private ?Resources\CompetitionTeamsResource $competitionTeams = null;
    private ?Resources\CompetitionsResource $competitions = null;
    private ?Resources\StandingRowsResource $standingRows = null;

    /**
     * Access BracketNodes peer Resource.
     */
    public function bracketNodes(): Resources\BracketNodesResource
    {
        return $this->bracketNodes ??= new Resources\BracketNodesResource($this->connector);
    }

    /**
     * Access CompetitionFixtures peer Resource.
     */
    public function competitionFixtures(): Resources\CompetitionFixturesResource
    {
        return $this->competitionFixtures ??= new Resources\CompetitionFixturesResource($this->connector);
    }

    /**
     * Access CompetitionTeams peer Resource.
     */
    public function competitionTeams(): Resources\CompetitionTeamsResource
    {
        return $this->competitionTeams ??= new Resources\CompetitionTeamsResource($this->connector);
    }

    /**
     * Access Competitions peer Resource.
     */
    public function competitions(): Resources\CompetitionsResource
    {
        return $this->competitions ??= new Resources\CompetitionsResource($this->connector);
    }

    /**
     * Access StandingRows peer Resource.
     */
    public function standingRows(): Resources\StandingRowsResource
    {
        return $this->standingRows ??= new Resources\StandingRowsResource($this->connector);
    }
}
