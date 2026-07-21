<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Observers;

use Stackra\Newsletter\Contracts\Data\NewsletterIssueInterface;
use Stackra\Newsletter\Enums\NewsletterIssueStatus;
use Stackra\Newsletter\Events\NewsletterIssueCancelled;
use Stackra\Newsletter\Events\NewsletterIssueDrafted;
use Stackra\Newsletter\Events\NewsletterIssuePublished;
use Stackra\Newsletter\Models\NewsletterIssue;

/**
 * Observer for the {@see NewsletterIssue} model.
 *
 * ## Hooks
 *
 *   - `created`   — fire {@see NewsletterIssueDrafted}.
 *   - `updated`   — on status transitions to `sent`, set `sent_at`
 *     and fire {@see NewsletterIssuePublished}. On transition to
 *     `cancelled`, fire {@see NewsletterIssueCancelled}.
 *     Scheduled-transition events are fired by the
 *     {@see \Stackra\Newsletter\Services\NewsletterServiceInterface::scheduleIssue()}
 *     path because the campaign row is created there in one
 *     transaction.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterIssueObserver
{
    /**
     * Fire the drafted event after insert.
     */
    public function created(NewsletterIssue $issue): void
    {
        NewsletterIssueDrafted::dispatch(
            (string) $issue->getKey(),
            (string) $issue->{NewsletterIssueInterface::ATTR_NEWSLETTER_ID},
        );
    }

    /**
     * Detect state transitions and fire the matching event.
     */
    public function updated(NewsletterIssue $issue): void
    {
        $changed = \array_keys($issue->getChanges());
        if (! \in_array(NewsletterIssueInterface::ATTR_STATUS, $changed, true)) {
            return;
        }

        $current = $issue->{NewsletterIssueInterface::ATTR_STATUS};

        // Transition → sent.
        if ($current === NewsletterIssueStatus::Sent
            || $current === NewsletterIssueStatus::Sent->value
        ) {
            $sentAt = $issue->{NewsletterIssueInterface::ATTR_SENT_AT} ?? \now();

            NewsletterIssuePublished::dispatch(
                (string) $issue->getKey(),
                // The linked campaign id is not always available on
                // the model — the service publishes an explicit
                // event with the campaign id, so we can pass an empty
                // string here safely (consumers use the issue id as
                // the primary key).
                '',
                $sentAt,
            );

            return;
        }

        // Transition → cancelled.
        if ($current === NewsletterIssueStatus::Cancelled
            || $current === NewsletterIssueStatus::Cancelled->value
        ) {
            $reason = (string) ($issue->{NewsletterIssueInterface::ATTR_CANCEL_REASON} ?? 'unspecified');

            NewsletterIssueCancelled::dispatch(
                (string) $issue->getKey(),
                null,
                $reason,
            );
        }
    }
}
