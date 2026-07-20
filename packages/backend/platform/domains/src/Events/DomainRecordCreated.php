<?php

declare(strict_types=1);

namespace Academorix\Domains\Events;

use Academorix\Domains\Models\DomainRecord;
use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a DomainRecord is seeded by DomainObserver.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'domains.record.created')]
final readonly class DomainRecordCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public DomainRecord $record)
    {
    }
}
