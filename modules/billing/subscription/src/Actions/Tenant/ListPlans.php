<?php

declare(strict_types=1);

namespace Academorix\Subscription\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Subscription\Contracts\Repositories\PlanRepositoryInterface;
use Academorix\Subscription\Data\PlanData;
use Academorix\Subscription\Enums\SubscriptionPermission;
use Academorix\Subscription\Models\Plan;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/plans` — return the public plan catalogue for the
 * tenant's Application.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.tenant.plans.list')]
#[Get('/api/v1/plans')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SubscriptionPermission::PlansViewAny)]
final class ListPlans
{
    use AsController;

    public function __construct(
        private readonly PlanRepositoryInterface $plans,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, PlanData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();
        // Read the tenant's application_id via the attribute
        // convention shared with the rest of the codebase.
        $applicationId = (string) $tenant->getAttribute('application_id');

        $rows = $this->plans
            ->findPublicForApplication($applicationId)
            ->map(static fn (Plan $p): PlanData => PlanData::fromModel($p));

        return new DataCollection(PlanData::class, $rows);
    }
}
