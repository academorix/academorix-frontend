<?php

declare(strict_types=1);

namespace Academorix\Webhook\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Academorix\Webhook\Contracts\Data\WebhookDeliveryInterface;
use Academorix\Webhook\Contracts\Repositories\WebhookDeliveryRepositoryInterface;
use Academorix\Webhook\Data\WebhookDeliveryData;
use Academorix\Webhook\Enums\WebhookPermission;
use Academorix\Webhook\Exceptions\WebhookDeliveryFailedException;

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
