<?php

declare(strict_types=1);

namespace Academorix\Notifications\InApp\Contracts\Services;

use Academorix\Notifications\InApp\Channels\InAppChannel;
use Academorix\Notifications\Models\Notification;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the in-app notification channel driver.
 *
 * The driver knows how to translate one persisted
 * {@see \Academorix\Notifications\Models\Notification} into:
 *
 *   1. A denormalised
 *      {@see \Academorix\Notifications\InApp\Models\InAppMessage}
 *      row (the inbox card the bell UI renders).
 *   2. A Reverb broadcast on `user.{id}.notifications` so open tabs
 *      receive the notification without a poll.
 *
 * The parent notifications module fires `NotificationDispatched`;
 * this module's listener dispatches
 * {@see \Academorix\Notifications\InApp\Jobs\BroadcastInAppNotificationJob}
 * which resolves this contract to do the work.
 *
 * `#[Bind(InAppChannel::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". Consumer
 * apps override the binding to a bespoke driver (analytics wrapper,
 * feature-flag gate) without touching the listener.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[Bind(InAppChannel::class)]
interface InAppChannelInterface
{
    /**
     * Send a notification through the in-app transport.
     *
     * Writes the denormalised inbox row + emits the Reverb broadcast.
     * Broadcast failure is logged but does NOT throw — the DB write
     * is the ground truth; the socket update is best-effort.
     *
     * @param  Notification  $notification  The persisted notification (produced by DispatchGateway).
     * @return string        The generated `InAppMessage` id (`iam_<ulid>`).
     */
    public function deliver(Notification $notification): string;
}
