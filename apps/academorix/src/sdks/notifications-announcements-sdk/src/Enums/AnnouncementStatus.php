<?php

declare(strict_types=1);

namespace Stackra\NotificationsAnnouncementsSdk\Enums;

/**
 * Wire-visible backed enum for `announcement.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category AnnouncementsSdk
 *
 * @since    0.1.0
 */
enum AnnouncementStatus: string
{
    case Draft = 'draft';
    case Scheduled = 'scheduled';
    case Published = 'published';
    case Expired = 'expired';
    case Cancelled = 'cancelled';
}
