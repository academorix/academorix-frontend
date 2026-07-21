<?php

declare(strict_types=1);

namespace Stackra\Versioning\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Versioning\Models\DeprecationNotice;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a DeprecationNotice transitions from draft to
 * published (`is_active = true`). Consumers listen to send customer
 * notifications and to invalidate the public catalog cache.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'versioning.deprecation_notice.published')]
final readonly class DeprecationNoticePublished implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public DeprecationNotice $notice)
    {
    }
}
