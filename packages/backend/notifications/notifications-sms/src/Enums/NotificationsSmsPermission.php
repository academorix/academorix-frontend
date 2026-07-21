<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the notifications-sms module contributes.
 *
 * Every permission binds to the tenant-user (`sanctum`) guard — SMS opt-out
 * management is tenant-admin territory; platform staff manage global (system)
 * opt-outs through the shared platform-admin surface.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum NotificationsSmsPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * List SMS opt-outs.
     */
    #[Label('List SMS Opt-Outs')]
    #[Description('Read the list of SMS opt-out records for the current tenant.')]
    case OptOutsViewAny = 'notifications.sms.opt-outs.viewAny';

    /**
     * Read a single SMS opt-out.
     */
    #[Label('View SMS Opt-Out')]
    #[Description('Read a single SMS opt-out record.')]
    case OptOutsView = 'notifications.sms.opt-outs.view';

    /**
     * Manually add an opt-out (reason=admin).
     */
    #[Label('Create SMS Opt-Out')]
    #[Description('Manually add a phone to the tenant\'s SMS opt-out list.')]
    case OptOutsCreate = 'notifications.sms.opt-outs.create';

    /**
     * Revoke an opt-out. Refused for `stop_keyword` unless super_admin +
     * explicit re-consent evidence.
     */
    #[Label('Revoke SMS Opt-Out')]
    #[Description('Revoke an SMS opt-out. STOP-keyword rows require super_admin + re-consent evidence.')]
    case OptOutsDelete = 'notifications.sms.opt-outs.delete';

    /**
     * View monthly cost report.
     */
    #[Label('View SMS Cost Report')]
    #[Description('View monthly SMS cost aggregation by country + provider.')]
    case CostReportView = 'notifications.sms.cost-report.view';

    /**
     * Which Laravel guard this permission binds to.
     */
    public function guard(): Guard
    {
        return Guard::Sanctum;
    }
}
