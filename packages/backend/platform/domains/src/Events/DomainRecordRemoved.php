<?php

declare(strict_types=1);

namespace Academorix\Domains\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a DomainRecord is deleted.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'domains.record.removed')]
final readonly class DomainRecordRemoved implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $tenantId,
        public string $domainId,
        public string $recordId,
    ) {
    }
}
