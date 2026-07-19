<?php

declare(strict_types=1);

namespace Academorix\Webhook\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Academorix\Webhook\Contracts\Data\WebhookDeliveryInterface;
use Academorix\Webhook\Contracts\Repositories\WebhookDeliveryRepositoryInterface;
use Academorix\Webhook\Data\Requests\RetryWebhookDeliveryRequestData;
use Academorix\Webhook\Data\WebhookDeliveryData;
use Academorix\Webhook\Enums\WebhookPermission;
use Academorix\Webhook\Exceptions\WebhookDeliveryFailedException;
use Academorix\Webhook\Jobs\DispatchWebhookJob;

/**
 * `POST /api/v1/tenant/webhook/deliveries/{id}/retry` — manual retry
 * of a failed delivery. Dispatches
 * {@see DispatchWebhookJob} with the same delivery id — the job
 * handles rate limiting + status transitions.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.tenant.deliveries.retry')]
#[Post('/api/v1/tenant/webhook/deliveries/{id}/retry')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(WebhookPermission::ManageOwn)]
final class RetryDelivery
{
    use AsController;

    public function __construct(
        private readonly WebhookDeliveryRepositoryInterface $deliveries,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(string $id, RetryWebhookDeliveryRequestData $data): WebhookDeliveryData
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

        DispatchWebhookJob::dispatch((string) $delivery->getKey());

        return WebhookDeliveryData::fromModel($delivery);
    }
}
