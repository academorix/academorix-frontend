<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Jobs;

use Academorix\Notifications\Contracts\Repositories\NotificationRepositoryInterface;
use Academorix\Notifications\Mail\Contracts\Services\MailChannelInterface;
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
 * Consume {@see \Academorix\Notifications\Events\NotificationDispatched}
 * for the `mail` channel: load the notification, hand off to the
 * channel driver, and log failures.
 *
 * Blueprint parameters:
 *
 *   - `#[Queue('notifications')]` — hits the shared queue. The
 *     dispatcher upgrades to `notifications-critical` for
 *     `priority=critical` sends at dispatch-time (parent listener
 *     concern).
 *   - `#[Tries(6)]` + `#[Backoff(30, 120, 600, 3600, 21600, 86400)]`
 *     — the mail channel is retry-heavy because provider 5xx and
 *     rate limits are typical.
 *   - `#[UniqueFor(300)]` — at most one send per notification within
 *     any 5-minute window. Prevents a duplicate dispatch (a worker
 *     restart mid-job) from double-sending.
 *
 * A suppressed recipient short-circuits inside the driver — the
 * job records the return-null case as `permanently_failed` and
 * does not retry.
 *
 * Blueprint reference:
 *   modules/notifications/blueprints/notifications-mail/jobs.json
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Timeout(120)]
#[Tries(6)]
#[Backoff(30, 120, 600, 3600, 21600, 86400)]
#[UniqueFor(300)]
final class SendMailJob implements ShouldBeUnique, ShouldQueue
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
     * Unique-lock key — one send attempt per notification, regardless
     * of how many times the parent event fires.
     */
    public function uniqueId(): string
    {
        return 'mail:' . $this->notificationId;
    }

    /**
     * Load the notification, hand off to the driver, log failures.
     */
    public function handle(
        NotificationRepositoryInterface $notifications,
        MailChannelInterface $channel,
        LoggerInterface $log,
    ): void {
        if (! (bool) \config('notifications-mail.enabled', true)) {
            // Master kill-switch off — no writes, no sends.
            return;
        }

        $notification = $notifications->find($this->notificationId);

        if ($notification === null) {
            $log->warning('notifications-mail: notification missing for send', [
                'notification_id' => $this->notificationId,
            ]);

            return;
        }

        try {
            $channel->deliver($notification);
        } catch (\Throwable $e) {
            // Log + let the queue retry with backoff. A hard-fail
            // path (address suppressed) never throws — the driver
            // returns null and we consider the job complete.
            $log->error('notifications-mail: send failed', [
                'notification_id' => $this->notificationId,
                'error'           => $e->getMessage(),
                'exception_class' => \get_class($e),
            ]);

            throw $e;
        }
    }

    /**
     * `failed()` — final failure hook. Never propagates.
     */
    public function failed(\Throwable $e): void
    {
        // No-op — the queue framework already records the failure.
        // Downstream failure listeners (per the notifications core)
        // observe the exhausted retry via the NotificationDelivery
        // state transition.
    }
}
