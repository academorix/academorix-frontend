<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Notifications;

use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Models\Newsletter;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notify the newsletter owner when the reputation monitor detects a
 * threshold breach or an auto-throttle event.
 *
 * Category: `newsletter.reputation_alert`. Not opt-out-able — the
 * signal is transactional-critical for the sender's ongoing
 * deliverability.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterReputationAlertNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  Newsletter    $newsletter  The affected publication.
     * @param  list<string>  $breached    Threshold keys breached.
     * @param  bool          $throttled   Whether the newsletter has
     *                                    been auto-throttled.
     */
    public function __construct(
        public readonly Newsletter $newsletter,
        public readonly array $breached,
        public readonly bool $throttled,
    ) {
    }

    /**
     * @return list<string>
     */
    public function via(mixed $notifiable): array
    {
        return ['mail', 'in_app'];
    }

    /**
     * Mail representation.
     */
    public function toMail(mixed $notifiable): MailMessage
    {
        $message = (new MailMessage())
            ->subject('Newsletter reputation alert')
            ->line(\sprintf(
                'Newsletter "%s" breached reputation thresholds: %s.',
                (string) $this->newsletter->{NewsletterInterface::ATTR_NAME},
                \implode(', ', $this->breached),
            ));

        if ($this->throttled) {
            $message->line('The newsletter has been auto-throttled and will not send new campaigns until an admin reviews.');
        }

        return $message;
    }

    /**
     * Array representation for the in-app channel.
     *
     * @return array<string, mixed>
     */
    public function toArray(mixed $notifiable): array
    {
        return [
            'category'      => 'newsletter.reputation_alert',
            'newsletter_id' => (string) $this->newsletter->getKey(),
            'breached'      => $this->breached,
            'throttled'     => $this->throttled,
        ];
    }
}
