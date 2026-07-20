<?php

declare(strict_types=1);

namespace Academorix\Compliance\Events;

use Academorix\Compliance\Models\Dsar;
use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a new DSAR is filed.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'compliance.dsar.requested')]
final readonly class DsarRequested implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public Dsar $dsar)
    {
    }
}
