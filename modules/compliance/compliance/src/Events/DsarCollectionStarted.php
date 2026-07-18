<?php

declare(strict_types=1);

namespace Academorix\Compliance\Events;

use Academorix\Compliance\Models\Dsar;
use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a DSAR moves to `collecting`.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'compliance.dsar.collection.started')]
final readonly class DsarCollectionStarted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public Dsar $dsar)
    {
    }
}
