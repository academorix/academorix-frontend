<?php

declare(strict_types=1);

namespace Stackra\Webhook\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Stackra\Webhook\Contracts\Data\WebhookDeliveryInterface;
use Stackra\Webhook\Contracts\Repositories\WebhookDeliveryRepositoryInterface;
use Stackra\Webhook\Data\WebhookDeliveryData;
use Stackra\Webhook\Enums\WebhookPermission;
use Stackra\Webhook\Exceptions\WebhookDeliveryFailedException;

/**
 * `GET /api/v1/tenant/webhook/deliveries/{id}` — show a single
 * delivery. 404 (thrown as WebhookDeliveryFailedException with a
 * "not found" message) when the id is unknown or cross-tenant.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.tenant.deliveries.show')]
#[Get('/api/v1/tenant/webhook/deliveries/{id}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(WebhookPermission::ManageOwn)]
final class ShowDelivery
{
    use AsController;

    public function __construct(
        private readonly WebhookDeliveryRepositoryInterface $deliveries,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(string $id): WebhookDeliveryData
    {
        $tenant   = $this->tenantContext->currentOrFail();
        $delivery = $this->deliveries->find($id);

        if ($delivery === null
            || (string) $delivery->{WebhookDeliveryInterface::ATTR_TENANT_ID} !== (string) $tenant->getKey()
        ) {
            throw new WebhookDeliveryFailedException(\sprintf(
                'Webhook delivery "%s" not found for this tenant.',
                $id,
            ));
        }

        return WebhookDeliveryData::fromModel($delivery);
    }
}
