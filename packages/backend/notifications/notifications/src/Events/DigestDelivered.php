<?php

declare(strict_types=1);

namespace Stackra\Notifications\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Notifications\Models\NotificationDigest;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a digest bucket has been rendered + delivered.
 *
 * Consumers mark items inside the digest as `sent-via-digest` and
 * emit analytics telemetry.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'notifications.digest.delivered')]
final readonly class DigestDelivered implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  NotificationDigest  $digest  The delivered digest bucket.
     */
    public function __construct(public NotificationDigest $digest)
    {
    }
}
