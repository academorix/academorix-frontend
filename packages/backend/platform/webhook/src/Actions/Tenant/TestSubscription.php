<?php

declare(strict_types=1);

namespace Stackra\Webhook\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Stackra\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Stackra\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Stackra\Webhook\Contracts\Services\WebhookSenderInterface;
use Stackra\Webhook\Data\Requests\TestWebhookSubscriptionRequestData;
use Stackra\Webhook\Data\WebhookDeliveryData;
use Stackra\Webhook\Enums\WebhookPermission;
use Stackra\Webhook\Exceptions\WebhookSubscriptionNotFoundException;

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
