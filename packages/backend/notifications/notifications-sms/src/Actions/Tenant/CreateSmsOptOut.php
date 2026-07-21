<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Sms\Contracts\Data\SmsOptOutInterface;
use Stackra\Notifications\Sms\Contracts\Repositories\SmsOptOutRepositoryInterface;
use Stackra\Notifications\Sms\Data\Requests\CreateSmsOptOutRequestData;
use Stackra\Notifications\Sms\Data\SmsOptOutData;
use Stackra\Notifications\Sms\Enums\NotificationsSmsPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

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
