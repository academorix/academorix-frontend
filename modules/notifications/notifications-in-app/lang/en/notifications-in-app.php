<?php

/**
 * @file modules/notifications/notifications-in-app/lang/en/notifications-in-app.php
 *
 * @description
 * English translations for the `academorix/notifications-in-app` module.
 */

declare(strict_types=1);

return [
    'errors' => [
        'not_found'          => 'The requested in-app message does not exist or is not visible to you.',
        'broadcast_failed'   => 'The Reverb broadcast could not be dispatched. The message is still visible on the next inbox refresh.',
        'reverb_unreachable' => 'The Reverb admin API is unreachable. Live updates are degraded — clients fall back to polling.',
    ],

    'labels' => [
        'message'         => 'Notification',
        'messages'        => 'Notifications',
        'inbox'           => 'Inbox',
        'bell'            => 'Notifications',
        'unread_count'    => 'Unread',
        'mark_read'       => 'Mark as read',
        'mark_all_read'   => 'Mark all as read',
        'dismiss'         => 'Dismiss',
    ],
];
