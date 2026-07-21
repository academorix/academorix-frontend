<?php

declare(strict_types=1);

namespace Stackra\Compliance\Events;

use Stackra\Compliance\Models\ConsentRecord;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a subject grants a consent decision.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'compliance.consent.given')]
final readonly class ConsentGiven implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public ConsentRecord $record)
    {
    }
}
