<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Services;

use Academorix\Newsletter\Contracts\Data\NewsletterCampaignInterface;
use Academorix\Newsletter\Contracts\Data\NewsletterIssueInterface;
use Academorix\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterCampaignRepositoryInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterIssueRepositoryInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterSubscriptionRepositoryInterface;
use Academorix\Newsletter\Contracts\Services\NewsletterServiceInterface;
use Academorix\Newsletter\Enums\NewsletterCampaignStatus;
use Academorix\Newsletter\Enums\NewsletterIssueStatus;
use Academorix\Newsletter\Enums\NewsletterSubscriptionStatus;
use Academorix\Newsletter\Events\NewsletterIssueScheduled;
use Academorix\Newsletter\Exceptions\CampaignSendInProgressException;
use Academorix\Newsletter\Exceptions\InvalidUnsubscribeTokenException;
use Academorix\Newsletter\Exceptions\NewsletterCampaignNotFoundException;
use Academorix\Newsletter\Exceptions\NewsletterIssueNotFoundException;
use Academorix\Newsletter\Exceptions\NewsletterStateInvalidTransitionException;
use Academorix\Newsletter\Exceptions\SubscriberAlreadyConfirmedException;
use Academorix\Newsletter\Models\NewsletterCampaign;
use Academorix\Newsletter\Models\NewsletterIssue;
use Academorix\Newsletter\Models\NewsletterSubscription;
use DateTimeInterface;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Psr\Log\LoggerInterface;

/**
 * Default {@see NewsletterServiceInterface} — orchestrates the
 * cross-aggregate lifecycle transitions the newsletter surface
 * exposes.
 *
 * ## Why Singleton
 *
 * Stateless orchestrator over repositories; safe to memoise across
 * requests under Octane per `octane-first-di.md`.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultNewsletterService implements NewsletterServiceInterface
{
    public function __construct(
        private readonly NewsletterIssueRepositoryInterface $issues,
        private readonly NewsletterCampaignRepositoryInterface $campaigns,
        private readonly NewsletterSubscriptionRepositoryInterface $subscriptions,
        #[Log('newsletter')] private readonly LoggerInterface $log,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function scheduleIssue(string $issueId, string $audienceId, DateTimeInterface $scheduledAt): NewsletterCampaign
    {
        /** @var NewsletterIssue|null $issue */
        $issue = $this->issues->find($issueId);
        if ($issue === null) {
            throw new NewsletterIssueNotFoundException('Issue not found.');
        }

        $status = $issue->{NewsletterIssueInterface::ATTR_STATUS};
        $value  = $status instanceof \BackedEnum ? $status->value : (string) $status;
        if (! \in_array($value, [
            NewsletterIssueStatus::Draft->value,
            NewsletterIssueStatus::Scheduled->value,
        ], true)) {
            throw new NewsletterStateInvalidTransitionException(
                'Only draft or already-scheduled issues can be scheduled.',
            );
        }

        // Both writes must land atomically — the issue-state
        // transition is meaningless without its campaign row.
        return DB::transaction(function () use ($issue, $audienceId, $scheduledAt): NewsletterCampaign {
            /** @var NewsletterCampaign $campaign */
            $campaign = $this->campaigns->create([
                NewsletterCampaignInterface::ATTR_TENANT_ID      => (string) $issue->{NewsletterIssueInterface::ATTR_TENANT_ID},
                NewsletterCampaignInterface::ATTR_NEWSLETTER_ID  => (string) $issue->{NewsletterIssueInterface::ATTR_NEWSLETTER_ID},
                NewsletterCampaignInterface::ATTR_ISSUE_ID       => (string) $issue->getKey(),
                NewsletterCampaignInterface::ATTR_AUDIENCE_ID    => $audienceId,
                NewsletterCampaignInterface::ATTR_STATUS         => NewsletterCampaignStatus::Pending->value,
                NewsletterCampaignInterface::ATTR_SCHEDULED_AT   => $scheduledAt,
                NewsletterCampaignInterface::ATTR_SEND_BATCH_SIZE => (int) \config('newsletter.campaign.default_batch_size', 500),
                NewsletterCampaignInterface::ATTR_THROTTLE_PER_SECOND => \config('newsletter.campaign.default_throttle_per_second'),
            ]);

            $issue->update([
                NewsletterIssueInterface::ATTR_STATUS       => NewsletterIssueStatus::Scheduled->value,
                NewsletterIssueInterface::ATTR_SCHEDULED_AT => $scheduledAt,
            ]);

            // Fire the composite event explicitly so consumers see
            // the (issue_id, campaign_id) pair together — the
            // observer would otherwise fire the events independently.
            NewsletterIssueScheduled::dispatch(
                (string) $issue->getKey(),
                (string) $campaign->getKey(),
                $scheduledAt,
            );

            return $campaign;
        });
    }

    /**
     * {@inheritDoc}
     */
    public function cancelCampaign(string $campaignId, string $reason): NewsletterCampaign
    {
        /** @var NewsletterCampaign|null $campaign */
        $campaign = $this->campaigns->find($campaignId);
        if ($campaign === null) {
            throw new NewsletterCampaignNotFoundException('Campaign not found.');
        }

        $status = $campaign->{NewsletterCampaignInterface::ATTR_STATUS};
        $value  = $status instanceof \BackedEnum ? $status->value : (string) $status;

        if ($value === NewsletterCampaignStatus::Completed->value) {
            throw new CampaignSendInProgressException(
                'Refusing to cancel a completed campaign.',
            );
        }
        if ($value === NewsletterCampaignStatus::Cancelled->value) {
            return $campaign;
        }

        return DB::transaction(function () use ($campaign, $reason): NewsletterCampaign {
            $campaign->update([
                NewsletterCampaignInterface::ATTR_STATUS         => NewsletterCampaignStatus::Cancelled->value,
                NewsletterCampaignInterface::ATTR_CANCELLED_AT   => \now(),
                NewsletterCampaignInterface::ATTR_FAILURE_REASON => $reason,
            ]);

            // Roll the linked issue back to draft, unless it already
            // sent.
            $issue = $this->issues->find(
                (string) $campaign->{NewsletterCampaignInterface::ATTR_ISSUE_ID},
            );
            if ($issue !== null) {
                $issueStatus = $issue->{NewsletterIssueInterface::ATTR_STATUS};
                $issueValue  = $issueStatus instanceof \BackedEnum ? $issueStatus->value : (string) $issueStatus;
                if ($issueValue !== NewsletterIssueStatus::Sent->value) {
                    $issue->update([
                        NewsletterIssueInterface::ATTR_STATUS        => NewsletterIssueStatus::Cancelled->value,
                        NewsletterIssueInterface::ATTR_CANCELLED_AT  => \now(),
                        NewsletterIssueInterface::ATTR_CANCEL_REASON => $reason,
                    ]);
                }
            }

            return $campaign->refresh();
        });
    }

    /**
     * {@inheritDoc}
     */
    public function confirmSubscription(string $token): NewsletterSubscription
    {
        $subscription = $this->subscriptions->findByConfirmationToken($token);
        if ($subscription === null) {
            throw new InvalidUnsubscribeTokenException('Confirmation token invalid.');
        }

        $status = $subscription->{NewsletterSubscriptionInterface::ATTR_STATUS};
        $value  = $status instanceof \BackedEnum ? $status->value : (string) $status;

        if ($value === NewsletterSubscriptionStatus::Active->value) {
            throw new SubscriberAlreadyConfirmedException(
                'Subscription already confirmed.',
            );
        }

        if ($value !== NewsletterSubscriptionStatus::PendingConfirmation->value) {
            throw new NewsletterStateInvalidTransitionException(
                'Only pending-confirmation subscriptions can be confirmed.',
            );
        }

        $expiresAt = $subscription->{NewsletterSubscriptionInterface::ATTR_CONFIRMATION_EXPIRES_AT};
        if ($expiresAt !== null && $expiresAt->isPast()) {
            throw new InvalidUnsubscribeTokenException('Confirmation token expired.');
        }

        return DB::transaction(function () use ($subscription): NewsletterSubscription {
            $subscription->update([
                NewsletterSubscriptionInterface::ATTR_STATUS             => NewsletterSubscriptionStatus::Active->value,
                NewsletterSubscriptionInterface::ATTR_CONFIRMED_AT       => \now(),
                NewsletterSubscriptionInterface::ATTR_SUBSCRIBED_AT      => $subscription->{NewsletterSubscriptionInterface::ATTR_SUBSCRIBED_AT} ?? \now(),
                NewsletterSubscriptionInterface::ATTR_CONFIRMATION_TOKEN => null,
            ]);

            return $subscription->refresh();
        });
    }

    /**
     * {@inheritDoc}
     */
    public function unsubscribe(string $token, string $reason = 'user_action'): NewsletterSubscription
    {
        $subscription = $this->subscriptions->findByUnsubscribeToken($token);
        if ($subscription === null) {
            throw new InvalidUnsubscribeTokenException('Unsubscribe token invalid.');
        }

        $status = $subscription->{NewsletterSubscriptionInterface::ATTR_STATUS};
        $value  = $status instanceof \BackedEnum ? $status->value : (string) $status;

        // Idempotent — a repeat unsubscribe returns the same row.
        if ($value === NewsletterSubscriptionStatus::Unsubscribed->value) {
            return $subscription;
        }

        return DB::transaction(function () use ($subscription, $reason): NewsletterSubscription {
            $subscription->update([
                NewsletterSubscriptionInterface::ATTR_STATUS             => NewsletterSubscriptionStatus::Unsubscribed->value,
                NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBED_AT    => \now(),
                NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBE_REASON => $reason,
            ]);

            return $subscription->refresh();
        });
    }

    /**
     * {@inheritDoc}
     */
    public function markIssueSent(string $issueId): NewsletterIssue
    {
        /** @var NewsletterIssue|null $issue */
        $issue = $this->issues->find($issueId);
        if ($issue === null) {
            throw new NewsletterIssueNotFoundException('Issue not found.');
        }

        $issue->update([
            NewsletterIssueInterface::ATTR_STATUS  => NewsletterIssueStatus::Sent->value,
            NewsletterIssueInterface::ATTR_SENT_AT => \now(),
        ]);

        $this->log->info('newsletter: issue marked sent', [
            'issue_id' => (string) $issue->getKey(),
        ]);

        return $issue->refresh();
    }

    /**
     * Utility — generate a fresh signed token for the confirmation
     * or unsubscribe flow. Used by the observer chain that seeds
     * new subscriptions.
     */
    public static function generateToken(): string
    {
        return Str::random(48);
    }
}
