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
use Academorix\Webhook\Contracts\Services\SecretRotatorInterface;
use Academorix\Webhook\Data\WebhookSubscriptionData;
use Academorix\Webhook\Enums\WebhookPermission;
use Academorix\Webhook\Exceptions\WebhookSubscriptionNotFoundException;

/**
 * `POST /api/v1/tenant/webhook/subscriptions/{id}/rotate-secret` —
 * rotate the signing secret. The response payload is the subscription
 * with `hasRotationGrace = true`; the fresh secret is fetched through
 * a separate reveal flow (never returned by wire).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.tenant.subscriptions.rotate')]
#[Post('/api/v1/tenant/webhook/subscriptions/{id}/rotate-secret')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(WebhookPermission::ManageOwn)]
final class RotateSecret
{
    use AsController;

    public function __construct(
        private readonly WebhookSubscriptionRepositoryInterface $subscriptions,
        private readonly TenantContextInterface $tenantContext,
        private readonly SecretRotatorInterface $rotator,
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

        $this->rotator->rotate($subscription);

        return WebhookSubscriptionData::fromModel($subscription->refresh());
    }
}
