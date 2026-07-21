<?php

declare(strict_types=1);

namespace Stackra\Compliance\Events;

use Stackra\Compliance\Models\DsarArtefact;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a contributor module finishes writing an
 * artefact for a DSAR.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'compliance.dsar.artefact.contributed')]
final readonly class DsarArtefactContributed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public DsarArtefact $artefact)
    {
    }
}
