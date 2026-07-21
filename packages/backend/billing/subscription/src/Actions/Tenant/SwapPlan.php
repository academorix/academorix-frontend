<?php

declare(strict_types=1);

namespace Stackra\Subscription\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Subscription\Contracts\Repositories\PlanRepositoryInterface;
use Stackra\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Stackra\Subscription\Contracts\Services\BillingServiceInterface;
use Stackra\Subscription\Data\Requests\SwapPlanRequestData;
use Stackra\Subscription\Data\SubscriptionData;
use Stackra\Subscription\Enums\SubscriptionPermission;
use Stackra\Subscription\Exceptions\PlanNotFoundException;
use Stackra\Subscription\Exceptions\SubscriptionNotFoundException;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

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
