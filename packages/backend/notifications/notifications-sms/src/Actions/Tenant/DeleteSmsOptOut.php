<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Notifications\Sms\Contracts\Repositories\SmsOptOutRepositoryInterface;
use Academorix\Notifications\Sms\Enums\NotificationsSmsPermission;
use Academorix\Notifications\Sms\Models\SmsOptOut;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
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
