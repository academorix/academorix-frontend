<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Contracts\Services;

use Academorix\Newsletter\Models\NewsletterCampaign;
use Academorix\Newsletter\Models\NewsletterIssue;
use Academorix\Newsletter\Models\NewsletterSubscription;
use Academorix\Newsletter\Services\DefaultNewsletterService;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;

/**
 * High-level orchestrator for cross-aggregate newsletter operations.
 *
 * ## Why a service (not just Actions)
 *
 * A handful of newsletter flows span multiple aggregates + write
 * paths in a single transaction — scheduling an issue creates the
 * campaign row, transitions the issue state, and dispatches the
 * orchestrator job. Cancelling a campaign flips both the campaign
 * and its issue back to non-terminal states. Confirming a
 * subscription mutates the row + fires the confirmation event +
 * refreshes the default audience cache.
 *
 * These are legitimate cross-action orchestrations (per
 * `.kiro/steering/actions-only-full.md` §Services/ - "genuine
 * cross-action orchestrators"), not CRUD wrappers.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Bind(DefaultNewsletterService::class)]
interface NewsletterServiceInterface
{
    /**
     * Schedule an issue for send at `$scheduledAt` against
     * `$audienceId`. Creates the matching {@see NewsletterCampaign}
     * row (state=pending) + transitions the issue to `scheduled`.
     *
     * @param  string             $issueId      Issue to schedule.
     * @param  string             $audienceId   Audience for the send.
     * @param  DateTimeInterface  $scheduledAt  When to dispatch.
     * @return NewsletterCampaign The persisted campaign row.
     */
    public function scheduleIssue(string $issueId, string $audienceId, DateTimeInterface $scheduledAt): NewsletterCampaign;

    /**
     * Cancel a pending or in-progress campaign. Flips the campaign
     * row to `cancelled`, transitions the linked issue back to
     * `draft` (unless already sent), and fires the cancelled event.
     *
     * @param  string  $campaignId  Campaign to cancel.
     * @param  string  $reason      Free-form reason string.
     */
    public function cancelCampaign(string $campaignId, string $reason): NewsletterCampaign;

    /**
     * Confirm a pending subscription by its confirmation token. On
     * success, transitions the subscription to `active`, sets
     * `confirmed_at`, clears the token, and fires the confirmed
     * event.
     *
     * @param  string  $token  Signed confirmation HMAC token.
     * @return NewsletterSubscription The active subscription.
     */
    public function confirmSubscription(string $token): NewsletterSubscription;

    /**
     * Unsubscribe a subscription by its unsubscribe token. Flips the
     * row to `unsubscribed`, sets `unsubscribed_at`, and fires the
     * removed event. Idempotent — a second call on an already-
     * unsubscribed row returns the same row without re-firing.
     *
     * @param  string  $token   Signed unsubscribe HMAC token.
     * @param  string  $reason  Reason string (defaults to
     *                          `user_action`).
     */
    public function unsubscribe(string $token, string $reason = 'user_action'): NewsletterSubscription;

    /**
     * Mark the issue as sent. Called by the orchestrator when every
     * batch completed. Sets `sent_at` + fires the published event.
     */
    public function markIssueSent(string $issueId): NewsletterIssue;
}
