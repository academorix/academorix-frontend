<?php

declare(strict_types=1);

namespace Academorix\Subscription\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Academorix\Subscription\Contracts\Services\BillingServiceInterface;
use Academorix\Subscription\Data\Requests\CancelSubscriptionRequestData;
use Academorix\Subscription\Data\SubscriptionData;
use Academorix\Subscription\Enums\SubscriptionPermission;
use Academorix\Subscription\Exceptions\SubscriptionNotFoundException;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `POST /api/v1/subscription/cancel` — cancel the tenant's
 * subscription, either at period end or immediately.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.tenant.cancel')]
#[Post('/api/v1/subscription/cancel')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SubscriptionPermission::SubscriptionManage)]
final class CancelSubscription
{
    use AsController;

    public function __construct(
        private readonly SubscriptionRepositoryInterface $subscriptions,
        private readonly BillingServiceInterface $billing,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(CancelSubscriptionRequestData $data): SubscriptionData
    {
        $tenant = $this->tenantContext->currentOrFail();
        $subscription = $this->subscriptions->findActiveForTenant((string) $tenant->getKey());

        if ($subscription === null) {
            throw new SubscriptionNotFoundException(
                'No active subscription to cancel.',
            );
        }

        $cancelled = $this->billing->cancel($subscription, $data->atPeriodEnd, $data->reason);

        return SubscriptionData::fromModel($cancelled->refresh());
    }
}
