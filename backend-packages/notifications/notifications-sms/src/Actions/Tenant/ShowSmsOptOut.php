<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Sms\Contracts\Repositories\SmsOptOutRepositoryInterface;
use Academorix\Notifications\Sms\Data\SmsOptOutData;
use Academorix\Notifications\Sms\Enums\NotificationsSmsPermission;
use Academorix\Notifications\Sms\Exceptions\SmsOptedOutException;
use Academorix\Notifications\Sms\Models\SmsOptOut;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/tenant/sms-opt-outs/{opt_out}` — show one opt-out.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.sms.opt-outs.show')]
#[Get('/api/v1/tenant/sms-opt-outs/{opt_out}')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(NotificationsSmsPermission::OptOutsView)]
final class ShowSmsOptOut
{
    use AsController;

    public function __construct(
        private readonly SmsOptOutRepositoryInterface $optOuts,
    ) {
    }

    public function __invoke(string $opt_out): SmsOptOutData
    {
        /** @var SmsOptOut|null $row */
        $row = $this->optOuts->find($opt_out);
        if ($row === null) {
            // Reuse the existing translation namespace — the caller sees a
            // 404 with a domain-appropriate error code.
            throw new SmsOptedOutException(\sprintf('Opt-out %s not found.', $opt_out));
        }

        return SmsOptOutData::fromModel($row);
    }
}
