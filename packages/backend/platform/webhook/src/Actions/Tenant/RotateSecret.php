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
use Stackra\Webhook\Contracts\Services\SecretRotatorInterface;
use Stackra\Webhook\Data\WebhookSubscriptionData;
use Stackra\Webhook\Enums\WebhookPermission;
use Stackra\Webhook\Exceptions\WebhookSubscriptionNotFoundException;

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
