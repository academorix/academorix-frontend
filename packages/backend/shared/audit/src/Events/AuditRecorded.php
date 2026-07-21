<?php

declare(strict_types=1);

namespace Stackra\Audit\Events;

use Stackra\Audit\Models\Audit;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a new audit row is persisted.
 *
 * Emitted from {@see \Stackra\Audit\Observers\AuditObserver::created()}
 * so downstream consumers (observability metrics, compliance
 * pipelines) can react without subscribing to owen-it's own event
 * shape.
 *
 * `ShouldDispatchAfterCommit` — the audit row is written inside the
 * originating aggregate's transaction. Listeners must not fire until
 * the transaction commits, otherwise a rolled-back audit would leak
 * a phantom "recorded" signal.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'audit.audit.recorded')]
final readonly class AuditRecorded implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Audit  $audit  The persisted audit row.
     */
    public function __construct(public Audit $audit)
    {
    }
}
