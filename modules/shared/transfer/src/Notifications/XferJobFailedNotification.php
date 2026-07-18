<?php

declare(strict_types=1);

namespace Academorix\Transfer\Notifications;

use Academorix\Transfer\Models\XferJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification for a `failed` XferJob.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class XferJobFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  XferJob  $job  The failed job.
     */
    public function __construct(public readonly XferJob $job)
    {
    }

    /**
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
            ->subject((string) \trans('transfer::notifications.failed.subject'))
            ->line('Your data transfer failed.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(mixed $notifiable): array
    {
        return ['xfer_job_id' => (string) $this->job->getKey()];
    }
}
