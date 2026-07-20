<?php

declare(strict_types=1);

namespace Academorix\Storage\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when signed URLs on a file are bulk-revoked.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'storage.signed_url.revoked')]
final readonly class SignedUrlRevoked implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $fileId,
        public string $reason,
        public int $revokedCount,
    ) {
    }
}
