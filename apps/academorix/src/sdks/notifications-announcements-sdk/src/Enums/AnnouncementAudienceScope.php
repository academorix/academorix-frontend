<?php

declare(strict_types=1);

namespace Academorix\NotificationsAnnouncementsSdk\Enums;

/**
 * Wire-visible backed enum for `announcement.audience_scope`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category AnnouncementsSdk
 *
 * @since    0.1.0
 */
enum AnnouncementAudienceScope: string
{
    case Tenant = 'tenant';
    case Organization = 'organization';
    case Branch = 'branch';
    case Team = 'team';
    case Role = 'role';
}
