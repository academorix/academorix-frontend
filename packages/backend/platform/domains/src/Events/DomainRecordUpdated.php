<?php

declare(strict_types=1);

namespace Stackra\Domains\Events;

use Stackra\Domains\Models\DomainRecord;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when the verifier updates a DomainRecord's status /
 * last_seen_value / last_check_at.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'domains.record.updated')]
final readonly class DomainRecordUpdated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  array<int, string>  $dirty  Columns that changed.
     */
    public function __construct(
        public DomainRecord $record,
        public array $dirty,
    ) {
    }
}
