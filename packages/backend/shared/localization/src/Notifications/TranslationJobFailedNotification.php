<?php

declare(strict_types=1);

namespace Stackra\Localization\Notifications;

use Stackra\Localization\Models\TranslationJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Transactional notification — the bulk translation job failed
 * after retries. Not opt-outable per
 * `notifications.categories.opt_out_allowed=false`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TranslationJobFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  TranslationJob  $job     The failed job.
     * @param  string          $reason  Human-readable failure reason.
     */
    public function __construct(
        public readonly TranslationJob $job,
        public readonly string $reason,
    ) {
    }

    /**
     * @return list<string>
     */
    public function via(mixed $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Build the mail-channel payload.
     */
    public function toMail(mixed $notifiable): MailMessage
    {
        return (new MailMessage())
            ->error()
            ->subject(\__('localization::notifications.job_failed.subject'))
            ->greeting(\__('localization::notifications.job_failed.greeting'))
            ->line(\__('localization::notifications.job_failed.line', [
                'reason' => $this->reason,
            ]));
    }

    /**
     * Build the database-channel payload.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(mixed $notifiable): array
    {
        return [
            'job_id'        => (string) $this->job->getKey(),
            'target_locale' => (string) $this->job->{'target_locale'},
            'error_message' => $this->reason,
        ];
    }
}
