<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Sms\Contracts\Data\SmsOptOutInterface;
use Academorix\Notifications\Sms\Contracts\Repositories\SmsOptOutRepositoryInterface;
use Academorix\Notifications\Sms\Data\Requests\CreateSmsOptOutRequestData;
use Academorix\Notifications\Sms\Data\SmsOptOutData;
use Academorix\Notifications\Sms\Enums\NotificationsSmsPermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `POST /api/v1/tenant/sms-opt-outs` — tenant admin manually adds an opt-out.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.sms.opt-outs.create')]
#[Post('/api/v1/tenant/sms-opt-outs')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(NotificationsSmsPermission::OptOutsCreate)]
final class CreateSmsOptOut
{
    use AsController;

    public function __construct(
        private readonly SmsOptOutRepositoryInterface $optOuts,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(CreateSmsOptOutRequestData $data): SmsOptOutData
    {
        $tenant   = $this->tenantContext->currentOrFail();
        $tenantId = (string) $tenant->getKey();

        $optOut = $this->optOuts->create([
            SmsOptOutInterface::ATTR_TENANT_ID    => $tenantId,
            SmsOptOutInterface::ATTR_PHONE        => $data->phone,
            SmsOptOutInterface::ATTR_REASON       => $data->reason->value,
            SmsOptOutInterface::ATTR_IS_SYSTEM    => false,
            SmsOptOutInterface::ATTR_OPTED_OUT_AT => now(),
        ]);

        return SmsOptOutData::fromModel($optOut);
    }
}
