<?php

declare(strict_types=1);

namespace Stackra\Compliance\Events;

use Stackra\Compliance\Models\Dsar;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a DSAR moves to `triaging`.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'compliance.dsar.triaged')]
final readonly class DsarTriaged implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public Dsar $dsar)
    {
    }
}
