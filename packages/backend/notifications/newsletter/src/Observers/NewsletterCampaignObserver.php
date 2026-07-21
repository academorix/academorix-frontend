<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Observers;

use Stackra\Newsletter\Contracts\Data\NewsletterCampaignInterface;
use Stackra\Newsletter\Enums\NewsletterCampaignStatus;
use Stackra\Newsletter\Events\NewsletterCampaignCompleted;
use Stackra\Newsletter\Events\NewsletterCampaignFailed;
use Stackra\Newsletter\Events\NewsletterCampaignScheduled;
use Stackra\Newsletter\Events\NewsletterCampaignStarted;
use Stackra\Newsletter\Models\NewsletterCampaign;

/**
 * Observer for the {@see NewsletterCampaign} model.
 *
 * ## Hooks
 *
 *   - `creating`  — initialise the counters map when missing.
 *   - `created`   — fire {@see NewsletterCampaignScheduled}.
 *   - `updated`   — on status transitions, fire the matching
 *     lifecycle event.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterCampaignObserver
{
    /**
     * Initialise the counters map on insert.
     */
    public function creating(NewsletterCampaign $campaign): void
    {
        if ($campaign->{NewsletterCampaignInterface::ATTR_COUNTERS} === null) {
            $campaign->{NewsletterCampaignInterface::ATTR_COUNTERS} = [
                'targeted'     => 0,
                'sent'         => 0,
                'opened'       => 0,
                'clicked'      => 0,
                'bounced'      => 0,
                'complained'   => 0,
                'unsubscribed' => 0,
                'suppressed'   => 0,
                'opted_out'    => 0,
            ];
        }
    }

    /**
     * Fire the scheduled event after insert.
     */
    public function created(NewsletterCampaign $campaign): void
    {
        NewsletterCampaignScheduled::dispatch(
            (string) $campaign->getKey(),
            $campaign->{NewsletterCampaignInterface::ATTR_SCHEDULED_AT} ?? \now(),
        );
    }

    /**
     * Detect state transitions and fire the matching event.
     */
    public function updated(NewsletterCampaign $campaign): void
    {
        $changed = \array_keys($campaign->getChanges());
        if (! \in_array(NewsletterCampaignInterface::ATTR_STATUS, $changed, true)) {
            return;
        }

        $current = $campaign->{NewsletterCampaignInterface::ATTR_STATUS};
        $value   = $current instanceof \BackedEnum ? $current->value : (string) $current;

        match ($value) {
            NewsletterCampaignStatus::InProgress->value => NewsletterCampaignStarted::dispatch(
                (string) $campaign->getKey(),
            ),

            NewsletterCampaignStatus::Completed->value => NewsletterCampaignCompleted::dispatch(
                (string) $campaign->getKey(),
                \is_array($campaign->{NewsletterCampaignInterface::ATTR_COUNTERS})
                    ? $campaign->{NewsletterCampaignInterface::ATTR_COUNTERS}
                    : [],
            ),

            NewsletterCampaignStatus::Failed->value => NewsletterCampaignFailed::dispatch(
                (string) $campaign->getKey(),
                (string) ($campaign->{NewsletterCampaignInterface::ATTR_FAILURE_REASON} ?? 'unspecified'),
            ),

            default => null,
        };
    }
}
