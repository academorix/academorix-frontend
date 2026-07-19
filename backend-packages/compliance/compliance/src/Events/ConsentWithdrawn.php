<?php

declare(strict_types=1);

namespace Academorix\Compliance\Events;

use Academorix\Compliance\Models\ConsentRecord;
use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a subject withdraws a previous consent.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'compliance.consent.withdrawn')]
final readonly class ConsentWithdrawn implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public ConsentRecord $record)
    {
    }
}
