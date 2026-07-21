<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Listeners;

use Stackra\Notifications\Sms\Contracts\Data\SmsOptOutInterface;
use Stackra\Notifications\Sms\Contracts\Repositories\SmsOptOutRepositoryInterface;
use Stackra\Notifications\Sms\Events\SmsSubscribedIn;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * Revoke a prior opt-out on receipt of a START-family keyword.
 *
 * Per CTIA guidelines, a user who replied STOP can send START to
 * re-subscribe. This listener soft-deletes the row + attaches a
 * `re_consent_evidence` flag to the metadata so the observer's guard on
 * `deleting` accepts the revoke.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
final class RevokeOptOutListener implements ShouldQueue
{
    public string $queue = 'notifications';

    public function __construct(
        private readonly SmsOptOutRepositoryInterface $optOuts,
    ) {
    }

    public function handle(SmsSubscribedIn $event): void
    {
        $optOut = $this->optOuts->findActiveForPhone($event->phone, $event->tenantId);
        if ($optOut === null) {
            return;
        }

        // Fold the START inbound message into metadata as re-consent
        // evidence so the observer's stop_keyword guard accepts the revoke.
        $metadata = (array) $optOut->getAttribute(SmsOptOutInterface::ATTR_METADATA);
        $metadata['re_consent_evidence'] = true;
        $metadata['re_consent_source']   = 'inbound_start_keyword';
        $metadata['re_consent_body']     = $event->inboundMessageBody;
        $metadata['re_consent_at']       = now()->toIso8601String();
        $optOut->setAttribute(SmsOptOutInterface::ATTR_METADATA, $metadata);
        $optOut->save();

        $optOut->delete();
    }
}
