<?php

declare(strict_types=1);

namespace Stackra\SportsDrillsSdk;

use Stackra\ApiSdk\Attributes\AsSdkResource;
use Stackra\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `drills` module.
 *
 * Registered under `#[AsSdkResource(name: 'drills', service: 'sports')]`
 * so the Sports service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->drills()->...`.
 *
 * ## Peer Resources
 *
 * - CurriculumWeeksResource — peer resource for `curriculum-weeks`.
 * - CurriculumsResource — peer resource for `curriculums`.
 * - DrillCategoriesResource — peer resource for `drill-categories`.
 * - DrillsResource — peer resource for `drills`.
 * - SessionPlanItemsResource — peer resource for `session-plan-items`.
 * - SessionPlansResource — peer resource for `session-plans`.
 *
 * @category DrillsSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'drills', service: 'sports')]
final class DrillsSdkResource extends BaseSdkResource
{
    private ?Resources\CurriculumWeeksResource $curriculumWeeks = null;
    private ?Resources\CurriculumsResource $curriculums = null;
    private ?Resources\DrillCategoriesResource $drillCategories = null;
    private ?Resources\DrillsResource $drills = null;
    private ?Resources\SessionPlanItemsResource $sessionPlanItems = null;
    private ?Resources\SessionPlansResource $sessionPlans = null;

    /**
     * Access CurriculumWeeks peer Resource.
     */
    public function curriculumWeeks(): Resources\CurriculumWeeksResource
    {
        return $this->curriculumWeeks ??= new Resources\CurriculumWeeksResource($this->connector);
    }

    /**
     * Access Curriculums peer Resource.
     */
    public function curriculums(): Resources\CurriculumsResource
    {
        return $this->curriculums ??= new Resources\CurriculumsResource($this->connector);
    }

    /**
     * Access DrillCategories peer Resource.
     */
    public function drillCategories(): Resources\DrillCategoriesResource
    {
        return $this->drillCategories ??= new Resources\DrillCategoriesResource($this->connector);
    }

    /**
     * Access Drills peer Resource.
     */
    public function drills(): Resources\DrillsResource
    {
        return $this->drills ??= new Resources\DrillsResource($this->connector);
    }

    /**
     * Access SessionPlanItems peer Resource.
     */
    public function sessionPlanItems(): Resources\SessionPlanItemsResource
    {
        return $this->sessionPlanItems ??= new Resources\SessionPlanItemsResource($this->connector);
    }

    /**
     * Access SessionPlans peer Resource.
     */
    public function sessionPlans(): Resources\SessionPlansResource
    {
        return $this->sessionPlans ??= new Resources\SessionPlansResource($this->connector);
    }
}
