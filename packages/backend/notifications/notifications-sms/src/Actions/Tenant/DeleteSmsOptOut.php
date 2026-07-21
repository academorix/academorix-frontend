<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Notifications\Sms\Contracts\Repositories\SmsOptOutRepositoryInterface;
use Stackra\Notifications\Sms\Enums\NotificationsSmsPermission;
use Stackra\Notifications\Sms\Models\SmsOptOut;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/tenant/sms-opt-outs/{opt_out}` — revoke an SMS opt-out.
 *
 * STOP-keyword rows require super_admin + re-consent evidence — that gate
 * lives on the observer's `deleting` hook.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsAction(name: 'notifications.sms.opt-outs.delete')]
#[Delete('/api/v1/tenant/sms-opt-outs/{opt_out}')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(NotificationsSmsPermission::OptOutsDelete)]
final class DeleteSmsOptOut
{
    use AsController;

    public function __construct(
        private readonly SmsOptOutRepositoryInterface $optOuts,
    ) {
    }

    public function __invoke(string $opt_out): Response
    {
        $row = $this->optOuts->find($opt_out);
        if ($row instanceof SmsOptOut) {
            $row->delete();
        }

        return \response()->noContent();
    }
}
