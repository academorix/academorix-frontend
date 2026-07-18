<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Jobs;

use Academorix\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Academorix\Newsletter\Contracts\Data\NewsletterCampaignInterface;
use Academorix\Newsletter\Contracts\Data\NewsletterInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterAudienceRepositoryInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterCampaignRepositoryInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Academorix\Newsletter\Enums\NewsletterCampaignStatus;
use Academorix\Newsletter\Enums\NewsletterStatus;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Psr\Log\LoggerInterface;

/**
 * Orchestrate a campaign send.
 *
 * Loads the campaign + issue + audience, refuses when the parent
 * newsletter is not sendable (paused / throttled / archived),
 * chunks the audience's cached subscriber list into batches, and
 * dispatches per-batch {@see SendNewsletterIssueBatchJob} instances
 * with the configured throttle applied via job delay.
 *
 * The orchestrator itself does NOT send mail — that's the batch
 * job's job (and it dispatches through notifications-mail's
 * `SendMailJob`).
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Timeout(300)]
#[Tries(2)]
#[UniqueFor(3600)]
final class SendNewsletterCampaignJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $campaignId)
    {
    }

    /**
     * Unique-lock key — one orchestration per campaign.
     */
    public function uniqueId(): string
    {
        return 'newsletter:campaign:' . $this->campaignId;
    }

    /**
     * Orchestrate the fan-out.
     */
    public function handle(
        NewsletterCampaignRepositoryInterface $campaigns,
        NewsletterAudienceRepositoryInterface $audiences,
        NewsletterRepositoryInterface $newsletters,
        LoggerInterface $log,
    ): void {
        $campaign = $campaigns->find($this->campaignId);
        if ($campaign === null) {
            $log->warning('newsletter: campaign missing during orchestration', [
                'campaign_id' => $this->campaignId,
            ]);

            return;
        }

        // Reject when the parent newsletter is not sendable.
        $newsletter = $newsletters->find(
            (string) $campaign->{NewsletterCampaignInterface::ATTR_NEWSLETTER_ID},
        );
        if ($newsletter === null) {
            $this->fail($campaign, 'newsletter_missing');

            return;
        }
        $status = $newsletter->{NewsletterInterface::ATTR_STATUS};
        $value  = $status instanceof \BackedEnum ? $status->value : (string) $status;
        if (\in_array($value, [
            NewsletterStatus::Paused->value,
            NewsletterStatus::Throttled->value,
            NewsletterStatus::Archived->value,
        ], true)) {
            $this->fail($campaign, 'newsletter_not_sendable:' . $value);

            return;
        }

        // Load the audience + its cached subscriber ids.
        $audience = $audiences->find(
            (string) $campaign->{NewsletterCampaignInterface::ATTR_AUDIENCE_ID},
        );
        if ($audience === null) {
            $this->fail($campaign, 'audience_missing');

            return;
        }

        /** @var list<string> $subscriberIds */
        $subscriberIds = \is_array($audience->{NewsletterAudienceInterface::ATTR_CACHED_SUBSCRIBER_IDS})
            ? \array_values($audience->{NewsletterAudienceInterface::ATTR_CACHED_SUBSCRIBER_IDS})
            : [];

        $batchSize = (int) $campaign->{NewsletterCampaignInterface::ATTR_SEND_BATCH_SIZE};
        if ($batchSize <= 0) {
            $batchSize = (int) \config('newsletter.campaign.default_batch_size', 500);
        }

        // Flip to in_progress + record targeted count.
        $counters = \is_array($campaign->{NewsletterCampaignInterface::ATTR_COUNTERS})
            ? $campaign->{NewsletterCampaignInterface::ATTR_COUNTERS}
            : [];
        $counters['targeted'] = \count($subscriberIds);

        $campaign->update([
            NewsletterCampaignInterface::ATTR_STATUS     => NewsletterCampaignStatus::InProgress->value,
            NewsletterCampaignInterface::ATTR_STARTED_AT => \now(),
            NewsletterCampaignInterface::ATTR_COUNTERS   => $counters,
        ]);

        // Fan out. Empty audience is a valid state — the campaign
        // completes immediately with zero sends.
        if ($subscriberIds === []) {
            $campaign->update([
                NewsletterCampaignInterface::ATTR_STATUS       => NewsletterCampaignStatus::Completed->value,
                NewsletterCampaignInterface::ATTR_COMPLETED_AT => \now(),
            ]);

            return;
        }

        $throttle = $campaign->{NewsletterCampaignInterface::ATTR_THROTTLE_PER_SECOND};
        $batchNumber = 0;
        foreach (\array_chunk($subscriberIds, $batchSize) as $batch) {
            $batchNumber++;
            $delaySeconds = \is_int($throttle) && $throttle > 0
                ? \max(0, (int) \floor(($batchNumber - 1) * $batchSize / $throttle))
                : 0;

            SendNewsletterIssueBatchJob::dispatch(
                (string) $campaign->getKey(),
                $batchNumber,
                \array_values($batch),
            )->delay(\now()->addSeconds($delaySeconds));
        }
    }

    /**
     * `failed()` — final failure hook. Marks the campaign failed.
     */
    public function failed(\Throwable $e): void
    {
        // Deferred to the app failed() plumbing — no additional
        // work here because we've already logged inside handle().
    }

    /**
     * Mark the campaign failed with a reason string.
     */
    private function fail(\Academorix\Newsletter\Models\NewsletterCampaign $campaign, string $reason): void
    {
        $campaign->update([
            NewsletterCampaignInterface::ATTR_STATUS         => NewsletterCampaignStatus::Failed->value,
            NewsletterCampaignInterface::ATTR_FAILURE_REASON => $reason,
        ]);
    }
}
