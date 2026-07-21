<?php

declare(strict_types=1);

namespace Stackra\Storage\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a tenant crosses its byte or file quota. The upload
 * that triggered this event was rejected —
 * {@see \Stackra\Storage\Exceptions\StorageQuotaExceededException}.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'storage.quota.exceeded')]
final readonly class StorageQuotaExceeded implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $tenantId,
        public int $consumedBytes,
        public int $capBytes,
        public int $incomingBytes,
    ) {
    }
}
