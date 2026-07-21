<?php

declare(strict_types=1);

namespace Stackra\Localization\Notifications;

use Stackra\Localization\Models\TranslationJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notifies the tenant admin that a bulk translation job finished.
 *
 * Ships two channels: `mail` (rich summary) + `database` (in-app
 * feed row). Consumer apps can extend / rebind to route through
 * other channels.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TranslationJobCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  TranslationJob  $job  The finished job (already
     *                              persisted with terminal state).
     */
    public function __construct(
        public readonly TranslationJob $job,
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
            ->subject(\__('localization::notifications.job_completed.subject'))
            ->greeting(\__('localization::notifications.job_completed.greeting'))
            ->line(\__('localization::notifications.job_completed.line', [
                'translated' => $this->job->{'translated_keys'},
                'total'      => $this->job->{'total_keys'},
                'locales'    => $this->job->{'target_locale'},
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
            'job_id'          => (string) $this->job->getKey(),
            'translated_keys' => (int) $this->job->{'translated_keys'},
            'failed_keys'     => (int) $this->job->{'failed_keys'},
            'total_keys'      => (int) $this->job->{'total_keys'},
            'target_locale'   => (string) $this->job->{'target_locale'},
        ];
    }
}
