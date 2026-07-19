<?php

declare(strict_types=1);

namespace Academorix\GrowthCrmLeadsSdk;

use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `crm-leads` module.
 *
 * Registered under `#[AsSdkResource(name: 'crm-leads', service: 'growth')]`
 * so the Growth service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->crmLeads()->...`.
 *
 * ## Peer Resources
 *
 * - LeadActivitiesResource — peer resource for `lead-activities`.
 * - LeadsResource — peer resource for `leads`.
 * - TasksResource — peer resource for `tasks`.
 *
 * @category CrmLeadsSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'crm-leads', service: 'growth')]
final class CrmLeadsSdkResource extends BaseSdkResource
{
    private ?Resources\LeadActivitiesResource $leadActivities = null;
    private ?Resources\LeadsResource $leads = null;
    private ?Resources\TasksResource $tasks = null;

    /**
     * Access LeadActivities peer Resource.
     */
    public function leadActivities(): Resources\LeadActivitiesResource
    {
        return $this->leadActivities ??= new Resources\LeadActivitiesResource($this->connector);
    }

    /**
     * Access Leads peer Resource.
     */
    public function leads(): Resources\LeadsResource
    {
        return $this->leads ??= new Resources\LeadsResource($this->connector);
    }

    /**
     * Access Tasks peer Resource.
     */
    public function tasks(): Resources\TasksResource
    {
        return $this->tasks ??= new Resources\TasksResource($this->connector);
    }
}
