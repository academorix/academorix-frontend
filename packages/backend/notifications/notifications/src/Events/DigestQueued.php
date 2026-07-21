<?php

declare(strict_types=1);

namespace Stackra\Notifications\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Notifications\Models\NotificationDigest;
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
