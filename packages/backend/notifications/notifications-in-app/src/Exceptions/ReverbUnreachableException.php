<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Exceptions;

use Stackra\Exceptions\StackraException;

/**
 * Raised when the Reverb HTTP admin API returns 5xx or times out.
 * Pages ops when sustained > 5 minutes. Retryable via the
 * `notifications.in-app-live-updates` feature-flag suppression
 * fallback (clients poll instead of receiving live updates).
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-in-app/errors.json
 *   (`NOTIFICATIONS_INAPP_REVERB_UNREACHABLE`)
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
final class ReverbUnreachableException extends StackraException
{
    /**
     * Stable machine-readable error code emitted on the JSON envelope.
     */
    public const CODE = 'notifications.in_app.reverb_unreachable';

    /**
     * Translation key for the humanised message.
     */
    public const TRANSLATION_KEY = 'notifications-in-app::errors.reverb_unreachable';
}
