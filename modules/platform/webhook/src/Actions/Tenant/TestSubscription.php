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
use Academorix\Webhook\Contracts\Services\WebhookSenderInterface;
use Academorix\Webhook\Data\Requests\TestWebhookSubscriptionRequestData;
use Academorix\Webhook\Data\WebhookDeliveryData;
use Academorix\Webhook\Enums\WebhookPermission;
use Academorix\Webhook\Exceptions\WebhookSubscriptionNotFoundException;

/**
 * `POST /api/v1/tenant/webhook/subscriptions/{id}/test` — fire a
 * test event through the subscription. Returns the created delivery
 * row so the tenant can inspect the outcome.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.tenant.subscriptions.test')]
#[Post('/api/v1/tenant/webhook/subscriptions/{id}/test')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(WebhookPermission::ManageOwn)]
final class TestSubscription
{
    use AsController;

    public function __construct(
        private readonly WebhookSubscriptionRepositoryInterface $subscriptions,
        private readonly TenantContextInterface $tenantContext,
        private readonly WebhookSenderInterface $sender,
    ) {
    }

    public function __invoke(string $id, TestWebhookSubscriptionRequestData $data): WebhookDeliveryData
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

        $events = $subscription->{WebhookSubscriptionInterface::ATTR_EVENTS} ?? [];
        $eventName = $data->eventName;
        if ($eventName === null) {
            $eventName = \is_array($events) && $events !== [] ? (string) $events[0] : 'webhook.test';
        }

        $delivery = $this->sender->send(
            $subscription,
            $eventName,
            [
                'test'      => true,
                'timestamp' => \now()->toIso8601String(),
                'tenant_id' => (string) $tenant->getKey(),
            ],
        );

        return WebhookDeliveryData::fromModel($delivery);
    }
}
