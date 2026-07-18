<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Notifications;

use Academorix\Newsletter\Contracts\Data\NewsletterCampaignInterface;
use Academorix\Newsletter\Models\NewsletterCampaign;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notify the newsletter owner when a campaign has completed sending.
 *
 * Category: `newsletter.campaign_completed`. Delivered via the
 * core notifications module — this class ships the Laravel
 * `Notification` skeleton the module's dispatcher uses.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterCampaignCompletedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly NewsletterCampaign $campaign)
    {
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
        $counters = \is_array($this->campaign->{NewsletterCampaignInterface::ATTR_COUNTERS})
            ? $this->campaign->{NewsletterCampaignInterface::ATTR_COUNTERS}
            : [];

        return (new MailMessage())
            ->subject('Your newsletter campaign has completed')
            ->line(\sprintf(
                'Campaign %s completed successfully.',
                (string) $this->campaign->getKey(),
            ))
            ->line(\sprintf(
                'Sent: %d / Targeted: %d / Opened: %d / Clicked: %d',
                (int) ($counters['sent'] ?? 0),
                (int) ($counters['targeted'] ?? 0),
                (int) ($counters['opened'] ?? 0),
                (int) ($counters['clicked'] ?? 0),
            ));
    }

    /**
     * Array representation for the in-app channel.
     *
     * @return array<string, mixed>
     */
    public function toArray(mixed $notifiable): array
    {
        return [
            'category'    => 'newsletter.campaign_completed',
            'campaign_id' => (string) $this->campaign->getKey(),
            'counters'    => \is_array($this->campaign->{NewsletterCampaignInterface::ATTR_COUNTERS})
                ? $this->campaign->{NewsletterCampaignInterface::ATTR_COUNTERS}
                : [],
        ];
    }
}
