<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Exceptions;

use Stackra\Exceptions\Exception;

/**
 * Raised when the Reverb (or configured broadcast) driver rejects a
 * dispatch attempt. The DB write always succeeds first; a broadcast
 * failure is a soft miss — the client will see the row on the next
 * inbox refresh.
 *
 * Non-retryable — the DB write is the ground truth. Retrying the
 * broadcast could double-fire on connected clients.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-in-app/errors.json
 *   (`NOTIFICATIONS_INAPP_BROADCAST_FAILED`)
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
final class BroadcastFailedException extends Exception
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'notifications.in_app.broadcast_failed';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'notifications-in-app::errors.broadcast_failed';
}
