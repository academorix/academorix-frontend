<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Sms\Contracts\Repositories\SmsOptOutRepositoryInterface;
use Stackra\Notifications\Sms\Data\SmsOptOutData;
use Stackra\Notifications\Sms\Enums\NotificationsSmsPermission;
use Stackra\Notifications\Sms\Exceptions\SmsOptedOutException;
use Stackra\Notifications\Sms\Models\SmsOptOut;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

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
