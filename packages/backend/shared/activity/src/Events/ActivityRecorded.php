<?php

declare(strict_types=1);

namespace Stackra\Activity\Events;

use Stackra\Activity\Models\Activity;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a new Activity row is persisted.
 *
 * Fires from the `Activity` model's `created` event, wrapped in
 * `ShouldDispatchAfterCommit` so downstream consumers (in-app feed
 * fan-out, analytics aggregation, dashboard invalidation) never see a
 * row that was rolled back.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'activity.activity.recorded')]
final readonly class ActivityRecorded implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Activity  $activity  The persisted activity row.
     */
    public function __construct(public Activity $activity)
    {
    }
}
