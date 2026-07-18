<?php

declare(strict_types=1);

namespace Academorix\Subscription\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Subscription\Contracts\Repositories\PlanRepositoryInterface;
use Academorix\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Academorix\Subscription\Contracts\Services\BillingServiceInterface;
use Academorix\Subscription\Data\Requests\SwapPlanRequestData;
use Academorix\Subscription\Data\SubscriptionData;
use Academorix\Subscription\Enums\SubscriptionPermission;
use Academorix\Subscription\Exceptions\PlanNotFoundException;
use Academorix\Subscription\Exceptions\SubscriptionNotFoundException;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `POST /api/v1/subscription/swap` — swap the tenant's active
 * subscription onto a new plan.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.tenant.swap')]
#[Post('/api/v1/subscription/swap')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SubscriptionPermission::SubscriptionManage)]
final class SwapPlan
{
    use AsController;

    public function __construct(
        private readonly SubscriptionRepositoryInterface $subscriptions,
        private readonly PlanRepositoryInterface $plans,
        private readonly BillingServiceInterface $billing,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(SwapPlanRequestData $data): SubscriptionData
    {
        $tenant = $this->tenantContext->currentOrFail();
        $subscription = $this->subscriptions->findActiveForTenant((string) $tenant->getKey());

        if ($subscription === null) {
            throw new SubscriptionNotFoundException(
                'No active subscription to swap.',
            );
        }

        $newPlan = $this->plans->find($data->planId);
        if ($newPlan === null) {
            throw new PlanNotFoundException(\sprintf('Plan "%s" not found.', $data->planId));
        }

        $swapped = $this->billing->swapPlan($subscription, $newPlan);

        return SubscriptionData::fromModel($swapped->refresh());
    }
}
