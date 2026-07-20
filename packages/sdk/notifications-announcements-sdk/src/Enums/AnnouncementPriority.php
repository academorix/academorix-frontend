<?php

declare(strict_types=1);

namespace Academorix\NotificationsAnnouncementsSdk\Enums;

/**
 * Wire-visible backed enum for `announcement.priority`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category AnnouncementsSdk
 *
 * @since    0.1.0
 */
enum AnnouncementPriority: string
{
    case Low = 'low';
    case Normal = 'normal';
    case High = 'high';
    case Urgent = 'urgent';
}
