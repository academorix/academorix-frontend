<?php

declare(strict_types=1);

namespace Academorix\Localization\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notifies the tenant admin when the tenant has consumed 80% of the
 * monthly AI-translation quota. Includes an upgrade CTA.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class MachineTranslationQuotaApproachingNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  int     $percentConsumed  Fraction of the quota consumed (0-100).
     * @param  string  $resetAt          ISO-8601 timestamp of the next reset.
     */
    public function __construct(
        public readonly int $percentConsumed,
        public readonly string $resetAt,
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
            ->subject(\__('localization::notifications.quota_approaching.subject'))
            ->greeting(\__('localization::notifications.quota_approaching.greeting', [
                'percent' => $this->percentConsumed,
            ]))
            ->line(\__('localization::notifications.quota_approaching.line', [
                'reset_at' => $this->resetAt,
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
            'percent_consumed' => $this->percentConsumed,
            'reset_at'         => $this->resetAt,
        ];
    }
}
