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
 * `POST /api/v1/tenant/webhook/subscriptions/{id}/resume` — resume a
 * paused subscription. Also clears the `disabled_reason` field when
 * transitioning from `disabled` (manual reactivation after an
 * auto-disable event).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.tenant.subscriptions.resume')]
#[Post('/api/v1/tenant/webhook/subscriptions/{id}/resume')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(WebhookPermission::ManageOwn)]
final class ResumeSubscription
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
            WebhookSubscriptionInterface::ATTR_STATUS               => WebhookSubscriptionStatus::Active->value,
            WebhookSubscriptionInterface::ATTR_DISABLED_AT          => null,
            WebhookSubscriptionInterface::ATTR_DISABLED_REASON      => null,
            WebhookSubscriptionInterface::ATTR_CONSECUTIVE_FAILURES => 0,
        ]);

        return WebhookSubscriptionData::fromModel($subscription->refresh());
    }
}
