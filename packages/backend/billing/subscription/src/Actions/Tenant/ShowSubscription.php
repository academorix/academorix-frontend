<?php

declare(strict_types=1);

namespace Stackra\Subscription\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Stackra\Subscription\Data\SubscriptionData;
use Stackra\Subscription\Enums\SubscriptionPermission;
use Stackra\Subscription\Exceptions\SubscriptionNotFoundException;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

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
