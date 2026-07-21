<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `progress` module.
 *
 * Registered under `#[AsSdkResource(name: 'progress', service: 'sports')]`
 * so the Sports service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->progress()->...`.
 *
 * ## Peer Resources
 *
 * - BeltRanksResource — peer resource for `belt-ranks`.
 * - CoachNotesResource — peer resource for `coach-notes`.
 * - GradingEventsResource — peer resource for `grading-events`.
 * - GradingResultsResource — peer resource for `grading-results`.
 * - ProgressAssessmentsResource — peer resource for `progress-assessments`.
 * - ProgressCardsResource — peer resource for `progress-cards`.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'progress', service: 'sports')]
final class ProgressSdkResource extends BaseSdkResource
{
    private ?Resources\BeltRanksResource $beltRanks = null;
    private ?Resources\CoachNotesResource $coachNotes = null;
    private ?Resources\GradingEventsResource $gradingEvents = null;
    private ?Resources\GradingResultsResource $gradingResults = null;
    private ?Resources\ProgressAssessmentsResource $progressAssessments = null;
    private ?Resources\ProgressCardsResource $progressCards = null;

    /**
     * Access BeltRanks peer Resource.
     */
    public function beltRanks(): Resources\BeltRanksResource
    {
        return $this->beltRanks ??= new Resources\BeltRanksResource($this->connector);
    }

    /**
     * Access CoachNotes peer Resource.
     */
    public function coachNotes(): Resources\CoachNotesResource
    {
        return $this->coachNotes ??= new Resources\CoachNotesResource($this->connector);
    }

    /**
     * Access GradingEvents peer Resource.
     */
    public function gradingEvents(): Resources\GradingEventsResource
    {
        return $this->gradingEvents ??= new Resources\GradingEventsResource($this->connector);
    }

    /**
     * Access GradingResults peer Resource.
     */
    public function gradingResults(): Resources\GradingResultsResource
    {
        return $this->gradingResults ??= new Resources\GradingResultsResource($this->connector);
    }

    /**
     * Access ProgressAssessments peer Resource.
     */
    public function progressAssessments(): Resources\ProgressAssessmentsResource
    {
        return $this->progressAssessments ??= new Resources\ProgressAssessmentsResource($this->connector);
    }

    /**
     * Access ProgressCards peer Resource.
     */
    public function progressCards(): Resources\ProgressCardsResource
    {
        return $this->progressCards ??= new Resources\ProgressCardsResource($this->connector);
    }
}
