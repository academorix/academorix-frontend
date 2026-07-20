<?php

declare(strict_types=1);

namespace Academorix\Transfer\Notifications;

use Academorix\Transfer\Models\XferJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification for a `succeeded` XferJob.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class XferJobCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  XferJob  $job  The completed job.
     */
    public function __construct(public readonly XferJob $job)
    {
    }

    /**
     * Channel resolution comes from `xfer_jobs.notify_channels` —
     * the observer freezes them at creation time.
     *
     * @return list<string>
     */
    public function via(mixed $notifiable): array
    {
        /** @var list<string> $channels */
        $channels = (array) $this->job->notify_channels;

        return $channels === [] ? ['database'] : $channels;
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject((string) \trans('transfer::notifications.completed.subject'))
            ->line('Your data transfer completed successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(mixed $notifiable): array
    {
        return ['xfer_job_id' => (string) $this->job->getKey()];
    }
}
