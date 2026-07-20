<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Events;

use Academorix\Notifications\Sms\Models\SmsOptOut;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Academorix\Events\Attributes\AsEvent;
/**
 * An SMS opt-out was created (either STOP-keyword or admin manual).
 *
 * Fired from the observer's `created` hook. Consumers propagate to
 * notification preferences, send the CTIA-required confirmation, and update
 * the compliance audit trail.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class SmsOptedOut implements ShouldDispatchAfterCommit
{
    public function __construct(
        public SmsOptOut $optOut,
    ) {
    }
}
