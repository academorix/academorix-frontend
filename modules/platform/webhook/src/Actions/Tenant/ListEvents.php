<?php

declare(strict_types=1);

namespace Academorix\Webhook\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Webhook\Contracts\Services\WebhookRegistryInterface;
use Academorix\Webhook\Enums\WebhookPermission;

/**
 * `GET /api/v1/tenant/webhook/events` — every registered webhook
 * event the tenant may subscribe to. Reads from
 * {@see WebhookRegistryInterface}.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsAction(name: 'webhook.tenant.events.list')]
#[Get('/api/v1/tenant/webhook/events')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(WebhookPermission::ManageOwn)]
final class ListEvents
{
    use AsController;

    public function __construct(
        private readonly WebhookRegistryInterface $registry,
    ) {
    }

    /**
     * @return array<int, array{name: string, version: string, description: string}>
     */
    public function __invoke(): array
    {
        $rows = [];
        foreach ($this->registry->all() as $name => $definition) {
            $rows[] = [
                'name'        => $name,
                'version'     => $definition['version'],
                'description' => $definition['description'],
            ];
        }

        return $rows;
    }
}
