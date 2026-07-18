<?php

declare(strict_types=1);

namespace Academorix\Subscription\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Subscription\Contracts\Data\PlanInterface;
use Academorix\Subscription\Contracts\Repositories\PlanRepositoryInterface;
use Academorix\Subscription\Data\PlanData;
use Academorix\Subscription\Enums\SubscriptionPermission;
use Academorix\Subscription\Exceptions\PlanNotFoundException;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `GET /api/v1/plans/{plan}` — return one plan visible to the
 * caller's tenant.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.tenant.plans.show')]
#[Get('/api/v1/plans/{plan}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SubscriptionPermission::PlansView)]
final class ShowPlan
{
    use AsController;

    public function __construct(
        private readonly PlanRepositoryInterface $plans,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(string $plan): PlanData
    {
        $tenant = $this->tenantContext->currentOrFail();
        $applicationId = (string) $tenant->getAttribute('application_id');

        $row = $this->plans->find($plan);
        if ($row === null) {
            throw new PlanNotFoundException(\sprintf('Plan "%s" not found.', $plan));
        }

        // Cross-Application defence in depth — the policy check
        // would refuse this, but we return 404 to avoid cross-tenant
        // enumeration.
        if ((string) $row->{PlanInterface::ATTR_APPLICATION_ID} !== $applicationId) {
            throw new PlanNotFoundException(\sprintf('Plan "%s" not found.', $plan));
        }

        return PlanData::fromModel($row);
    }
}
