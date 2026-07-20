<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Notifications;

use Academorix\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Academorix\Newsletter\Models\NewsletterSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent to a new subscriber with a signed confirmation link.
 * Category: `newsletter.subscribe_confirmation`. Only sent for
 * double-opt-in newsletters (per newsletter's
 * `confirmation_required` flag).
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterSubscribeConfirmationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  NewsletterSubscription  $subscription     The pending subscription.
     * @param  string                  $confirmationUrl  Signed confirmation URL.
     */
    public function __construct(
        public readonly NewsletterSubscription $subscription,
        public readonly string $confirmationUrl,
    ) {
    }

    /**
     * @return list<string>
     */
    public function via(mixed $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Mail representation.
     */
    public function toMail(mixed $notifiable): MailMessage
    {
        return (new MailMessage())
            ->subject('Please confirm your newsletter subscription')
            ->line(\sprintf(
                'Someone (hopefully you) subscribed %s to a newsletter.',
                (string) $this->subscription->{NewsletterSubscriptionInterface::ATTR_EMAIL},
            ))
            ->action('Confirm subscription', $this->confirmationUrl)
            ->line('If you did not request this subscription, you can safely ignore this email.');
    }
}
