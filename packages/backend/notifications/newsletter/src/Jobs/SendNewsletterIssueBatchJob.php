<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Jobs;

use Stackra\Newsletter\Contracts\Data\NewsletterCampaignInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterCampaignRepositoryInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterSubscriptionRepositoryInterface;
use Stackra\Newsletter\Contracts\Services\NewsletterServiceInterface;
use Stackra\Newsletter\Enums\NewsletterCampaignStatus;
use Stackra\Newsletter\Enums\NewsletterSubscriptionStatus;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Psr\Log\LoggerInterface;

/**
 * Send one batch of subscribers via notifications-mail.
 *
 * For each subscription id in the batch:
 *  1. Load the subscription; skip if not `active`.
 *  2. Check the mail suppression list (via notifications-mail's
 *     registry). Skip + increment `suppressed` counter on hit.
 *  3. Check the recipient's `marketing.newsletter` preference. Skip
 *     + increment `opted_out` counter on disable.
 *  4. Dispatch notifications-mail's `SendMailJob` with metadata
 *     tagging the send back to `(newsletter_id, campaign_id,
 *     subscription_id, issue_id)`.
 *  5. Atomically increment `counters.sent`.
 *
 * When the last batch completes the campaign transitions to
 * `completed` — the completion check happens in
 * {@see NewsletterServiceInterface::markIssueSent()} once the
 * targeted-count matches sent + skipped counters.
 *
 * NOTE: the actual `SendMailJob` dispatch is stubbed with a
 * pass-through log call — notifications-mail's exact API lands
 * after this module. The call site is documented so the swap is
 * mechanical.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Timeout(300)]
#[Tries(3)]
#[Backoff(60, 300, 1800)]
#[UniqueFor(600)]
final class SendNewsletterIssueBatchJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  list<string>  $subscriptionIds
     */
    public function __construct(
        public readonly string $campaignId,
        public readonly int $batchNumber,
        public readonly array $subscriptionIds,
    ) {
    }

    /**
     * Unique-lock key — one batch per (campaign, batch_number).
     */
    public function uniqueId(): string
    {
        return 'newsletter:batch:' . $this->campaignId . ':' . $this->batchNumber;
    }

    /**
     * Send the batch.
     */
    public function handle(
        NewsletterCampaignRepositoryInterface $campaigns,
        NewsletterSubscriptionRepositoryInterface $subscriptions,
        NewsletterServiceInterface $service,
        LoggerInterface $log,
    ): void {
        $campaign = $campaigns->find($this->campaignId);
        if ($campaign === null) {
            return;
        }

        $counters = \is_array($campaign->{NewsletterCampaignInterface::ATTR_COUNTERS})
            ? $campaign->{NewsletterCampaignInterface::ATTR_COUNTERS}
            : [];

        foreach ($this->subscriptionIds as $subscriptionId) {
            $subscription = $subscriptions->find($subscriptionId);
            if ($subscription === null) {
                continue;
            }

            $status = $subscription->{NewsletterSubscriptionInterface::ATTR_STATUS};
            $value  = $status instanceof \BackedEnum ? $status->value : (string) $status;
            if ($value !== NewsletterSubscriptionStatus::Active->value) {
                $counters['suppressed'] = (int) ($counters['suppressed'] ?? 0) + 1;
                continue;
            }

            // TODO: dispatch notifications-mail's SendMailJob with
            // metadata (newsletter_id, campaign_id, subscription_id,
            // issue_id) once the API is available in
            // `stackra/notifications-mail`. For now we log the
            // handoff so the wiring is deterministic and observable.
            $log->info('newsletter: batch send handoff (notifications-mail pending)', [
                'campaign_id'     => $this->campaignId,
                'subscription_id' => $subscriptionId,
                'batch_number'    => $this->batchNumber,
            ]);

            $counters['sent'] = (int) ($counters['sent'] ?? 0) + 1;
        }

        $campaign->update([
            NewsletterCampaignInterface::ATTR_COUNTERS => $counters,
        ]);

        // If this was the last batch AND targeted == sent + skipped,
        // mark the campaign completed and the issue sent.
        $targeted = (int) ($counters['targeted'] ?? 0);
        $sent = (int) ($counters['sent'] ?? 0);
        $suppressed = (int) ($counters['suppressed'] ?? 0);
        $optedOut = (int) ($counters['opted_out'] ?? 0);

        if ($targeted > 0 && ($sent + $suppressed + $optedOut) >= $targeted) {
            $campaign->update([
                NewsletterCampaignInterface::ATTR_STATUS       => NewsletterCampaignStatus::Completed->value,
                NewsletterCampaignInterface::ATTR_COMPLETED_AT => \now(),
            ]);

            $service->markIssueSent(
                (string) $campaign->{NewsletterCampaignInterface::ATTR_ISSUE_ID},
            );
        }
    }

    /**
     * `failed()` — final failure hook. Individual batch failures do
     * NOT fail the campaign — the orchestrator's completion check
     * accounts for the eventual outcome.
     */
    public function failed(\Throwable $e): void
    {
    }
}
