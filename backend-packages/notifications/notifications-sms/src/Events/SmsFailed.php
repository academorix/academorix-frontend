<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

/**
 * Provider or carrier reported a transient failure.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
final readonly class SmsFailed implements ShouldDispatchAfterCommit
{
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public string $provider,
        public string $errorCode,
        public string $errorMessage,
    ) {
    }
}
