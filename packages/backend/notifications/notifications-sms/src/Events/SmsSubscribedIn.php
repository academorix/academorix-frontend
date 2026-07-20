<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Academorix\Events\Attributes\AsEvent;
/**
 * User replied with a START-family keyword — re-subscribe per CTIA guidelines.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class SmsSubscribedIn implements ShouldDispatchAfterCommit
{
    public function __construct(
        public string $tenantId,
        public string $phone,
        public string $inboundMessageBody,
        public string $provider,
    ) {
    }
}
