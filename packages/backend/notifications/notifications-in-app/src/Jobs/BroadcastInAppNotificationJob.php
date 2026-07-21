<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Jobs;

use Stackra\Notifications\Contracts\Repositories\NotificationRepositoryInterface;
use Stackra\Notifications\InApp\Contracts\Services\InAppChannelInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Psr\Log\LoggerInterface;

/**
 * Consume {@see \Stackra\Notifications\Events\NotificationDispatched}
 * for the `in_app` channel: create the delivery row via the channel
 * driver + emit the Reverb broadcast.
 *
 * `#[Queue('notifications')]` per blueprint `jobs.json`.
 * `#[Tries(2)]` + `#[Backoff(30, 60)]` — covers transient DB flakes.
 * `#[UniqueFor(60)]` — prevents duplicate broadcast if a worker
 * restarts mid-job (uniqueVia the notification_id).
 *
 * A broadcast failure is logged and NOT retried — the DB write is
 * the ground truth; a retry would fan out double-broadcasts to
 * connected clients.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-in-app/jobs.json
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Timeout(60)]
#[Tries(2)]
#[Backoff(30, 60)]
#[UniqueFor(60)]
final class BroadcastInAppNotificationJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  string  $notificationId  The persisted `Notification` id (`not_<ulid>`).
     */
    public function __construct(public readonly string $notificationId)
    {
    }

    /**
     * Unique-lock key — one broadcast per notification, regardless of
     * how many times the parent event fires (should be exactly once
     * per dispatch, but we defend against duplicate events).
     */
    public function uniqueId(): string
    {
        return 'in-app:' . $this->notificationId;
    }

    /**
     * Load the notification, hand off to the driver, log failures.
     */
    public function handle(
        NotificationRepositoryInterface $notifications,
        InAppChannelInterface $channel,
        LoggerInterface $log,
    ): void {
        if (! (bool) \config('notifications-in-app.enabled', true)) {
            // Master kill-switch off — no writes, no broadcasts.
            return;
        }

        $notification = $notifications->find($this->notificationId);
        if ($notification === null) {
            $log->warning('notifications-in-app: notification missing for broadcast', [
                'notification_id' => $this->notificationId,
            ]);

            return;
        }

        try {
            $channel->deliver($notification);
        } catch (\Throwable $e) {
            // Log + swallow. Retrying a broadcast that already wrote
            // the DB row would double-broadcast on the retry. The
            // client will see the row on the next inbox refresh.
            $log->error('notifications-in-app: broadcast failed', [
                'notification_id' => $this->notificationId,
                'error'           => $e->getMessage(),
                'exception_class' => \get_class($e),
            ]);
        }
    }

    /**
     * `failed()` — final failure hook. Never propagates.
     */
    public function failed(\Throwable $e): void
    {
        // No-op — the queue framework already records the failure and
        // the broadcast-failed error code is logged in handle().
    }
}
