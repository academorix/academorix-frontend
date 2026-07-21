<?php

declare(strict_types=1);

namespace Stackra\Geography\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Ops notification — fires when {@see \Stackra\Geography\Jobs\RefreshMaxMindDatabaseJob}
 * has exhausted every retry.
 *
 * Routing target is `config('geography.maxmind.notify_email')` in
 * the job's `failed()` hook. Consumer apps override the recipient
 * (default `ops@localhost`) via env.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class MaxMindRefreshFailedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  string  $reason  Trailing exception message from the
     *                          final retry.
     */
    public function __construct(private readonly string $reason)
    {
    }

    /**
     * Channels this notification is delivered on.
     *
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build the mail representation.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage())
            ->error()
            ->subject('MaxMind GeoLite2 refresh failed')
            ->line('The weekly MaxMind GeoLite2 database refresh has failed after every retry.')
            ->line('Trailing reason: ' . $this->reason)
            ->line('Fallback: /geolocate will continue to resolve via ip-api.com until the database refreshes.');
    }
}
