<?php

declare(strict_types=1);

namespace Academorix\Webhook\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Academorix\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Academorix\Webhook\Data\WebhookSubscriptionData;
use Academorix\Webhook\Enums\WebhookPermission;
use Academorix\Webhook\Models\WebhookSubscription;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/tenant/webhook/subscriptions` — every subscription
 * owned by the caller's tenant.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.tenant.subscriptions.list')]
#[Get('/api/v1/tenant/webhook/subscriptions')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(WebhookPermission::ManageOwn)]
final class ListSubscriptions
{
    use AsController;

    public function __construct(
        private readonly WebhookSubscriptionRepositoryInterface $subscriptions,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, WebhookSubscriptionData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();

        $rows = $this->subscriptions
            ->findByTenant((string) $tenant->getKey())
            ->map(static fn (WebhookSubscription $s): WebhookSubscriptionData => WebhookSubscriptionData::fromModel($s));

        return new DataCollection(WebhookSubscriptionData::class, $rows);
    }
}
