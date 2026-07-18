<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Events;

use Academorix\Notifications\Sms\Models\SmsOptOut;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

/**
 * An SMS opt-out was revoked (either admin action or START-keyword reply).
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
final readonly class SmsOptOutRevoked implements ShouldDispatchAfterCommit
{
    public function __construct(
        public SmsOptOut $optOut,
        public ?string $revokedByUserId = null,
    ) {
    }
}
