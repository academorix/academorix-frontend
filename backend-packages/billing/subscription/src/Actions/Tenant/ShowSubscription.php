<?php

declare(strict_types=1);

namespace Academorix\Subscription\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Academorix\Subscription\Data\SubscriptionData;
use Academorix\Subscription\Enums\SubscriptionPermission;
use Academorix\Subscription\Exceptions\SubscriptionNotFoundException;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `GET /api/v1/subscription` — return the tenant's own active
 * subscription.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.tenant.show')]
#[Get('/api/v1/subscription')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SubscriptionPermission::SubscriptionView)]
final class ShowSubscription
{
    use AsController;

    public function __construct(
        private readonly SubscriptionRepositoryInterface $subscriptions,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(): SubscriptionData
    {
        $tenant = $this->tenantContext->currentOrFail();
        $subscription = $this->subscriptions->findActiveForTenant((string) $tenant->getKey());

        if ($subscription === null) {
            throw new SubscriptionNotFoundException(
                'No active subscription for the current tenant.',
            );
        }

        return SubscriptionData::fromModel($subscription);
    }
}
