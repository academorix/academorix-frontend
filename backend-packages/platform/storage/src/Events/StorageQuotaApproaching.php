<?php

declare(strict_types=1);

namespace Academorix\Storage\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a tenant crosses the "approaching quota" threshold —
 * by default 90% of the byte or file cap. Consumers typically send
 * a proactive notification to the tenant admin.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'storage.quota.approaching')]
final readonly class StorageQuotaApproaching implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $tenantId,
        public int $consumedBytes,
        public int $capBytes,
        public float $pctConsumed,
    ) {
    }
}
