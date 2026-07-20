<?php

declare(strict_types=1);

namespace Academorix\Notifications\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Notifications\Models\NotificationDigest;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when the digest scheduler adds a notification to a
 * pending digest bucket instead of dispatching immediately.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.digest.queued')]
final readonly class DigestQueued implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  NotificationDigest  $digest  The bucket the notification was added to.
     */
    public function __construct(public NotificationDigest $digest)
    {
    }
}
