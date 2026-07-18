<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Sms\Contracts\Repositories\SmsOptOutRepositoryInterface;
use Academorix\Notifications\Sms\Data\SmsOptOutData;
use Academorix\Notifications\Sms\Enums\NotificationsSmsPermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `GET /api/v1/tenant/sms-opt-outs` — list SMS opt-outs for the current
 * tenant.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.sms.opt-outs.list')]
#[Get('/api/v1/tenant/sms-opt-outs')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(NotificationsSmsPermission::OptOutsViewAny)]
final class ListSmsOptOuts
{
    use AsController;

    public function __construct(
        private readonly SmsOptOutRepositoryInterface $optOuts,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return array<int, SmsOptOutData>
     */
    public function __invoke(): array
    {
        $tenant   = $this->tenantContext->currentOrFail();
        $tenantId = (string) $tenant->getKey();

        return $this->optOuts->findByTenant($tenantId)
            ->map(static fn ($optOut): SmsOptOutData => SmsOptOutData::fromModel($optOut))
            ->all();
    }
}
