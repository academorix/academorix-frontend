<?php

declare(strict_types=1);

namespace Stackra\Application\Events;

use Stackra\Application\Models\BusinessType;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a tenant custom {@see BusinessType} is created.
 *
 * System rows land via the seeder and DO NOT fire this event — the
 * observer only dispatches for `is_system = false` rows. Consumers:
 * per-tenant feature-flag seed, terminology cache warm-up.
 *
 * `#[AsEvent(name: 'application.business_type.added')]` marks this class
 * for the events package's boot-time discovery.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'application.business_type.added')]
final readonly class BusinessTypeAdded implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  BusinessType  $businessType  The tenant-custom row that was created.
     */
    public function __construct(public BusinessType $businessType)
    {
    }
}
