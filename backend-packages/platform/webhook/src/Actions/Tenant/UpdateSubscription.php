<?php

declare(strict_types=1);

namespace Academorix\Webhook\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Academorix\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Academorix\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Academorix\Webhook\Data\Requests\UpdateWebhookSubscriptionRequestData;
use Academorix\Webhook\Data\WebhookSubscriptionData;
use Academorix\Webhook\Enums\WebhookPermission;
use Academorix\Webhook\Exceptions\WebhookSubscriptionNotFoundException;

/**
 * `PATCH /api/v1/tenant/webhook/subscriptions/{id}` — tenant admin
 * updates a subscription. Only fields the caller supplied are touched
 * (Spatie's `Optional`).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.tenant.subscriptions.update')]
#[Patch('/api/v1/tenant/webhook/subscriptions/{id}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(WebhookPermission::ManageOwn)]
final class UpdateSubscription
{
    use AsController;

    public function __construct(
        private readonly WebhookSubscriptionRepositoryInterface $subscriptions,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(string $id, UpdateWebhookSubscriptionRequestData $data): WebhookSubscriptionData
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

        // Only include fields the caller supplied — Spatie's Optional
        // instances round-trip through `toArray()` as absent keys.
        $payload = \array_filter(
            $data->toArray(),
            static fn (mixed $v): bool => $v !== null,
        );
        // Never let the caller change tenant_id.
        unset($payload[WebhookSubscriptionInterface::ATTR_TENANT_ID]);

        $subscription->update($payload);

        return WebhookSubscriptionData::fromModel($subscription->refresh());
    }
}
