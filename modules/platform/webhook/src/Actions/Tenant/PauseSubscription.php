<?php

declare(strict_types=1);

namespace Academorix\Webhook\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Academorix\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Academorix\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Academorix\Webhook\Data\WebhookSubscriptionData;
use Academorix\Webhook\Enums\WebhookPermission;
use Academorix\Webhook\Enums\WebhookSubscriptionStatus;
use Academorix\Webhook\Exceptions\WebhookSubscriptionNotFoundException;

/**
 * `POST /api/v1/tenant/webhook/subscriptions/{id}/pause` — manually
 * pause dispatches. New deliveries queue but do not dispatch until
 * resumed.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.tenant.subscriptions.pause')]
#[Post('/api/v1/tenant/webhook/subscriptions/{id}/pause')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(WebhookPermission::ManageOwn)]
final class PauseSubscription
{
    use AsController;

    public function __construct(
        private readonly WebhookSubscriptionRepositoryInterface $subscriptions,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(string $id): WebhookSubscriptionData
    {
        $tenant       = $this->tenantContext->currentOrFail();
        $subscription = $this->subscriptions->find($id);

        if ($subscription === null
            || (string) $subscription->{WebhookSubscriptionInterface::ATTR_TENANT_ID} !== (string) $tenant->getKey()
        ) {
            throw new WebhookSubscriptionNotFoundException(\sprintf(
                'Webhook subscription "%s" not found for this tenant.',
                $id,
            ));
        }

        $subscription->update([
            WebhookSubscriptionInterface::ATTR_STATUS => WebhookSubscriptionStatus::Paused->value,
        ]);

        return WebhookSubscriptionData::fromModel($subscription->refresh());
    }
}
