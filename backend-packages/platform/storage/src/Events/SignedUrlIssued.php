<?php

declare(strict_types=1);

namespace Academorix\Storage\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Storage\Models\SignedUrlAudit;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired when a signed URL is issued for a file (or a variant).
 * Listeners can log the issuance to an activity feed or fire
 * downstream abuse-detection heuristics.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'storage.signed_url.issued')]
final readonly class SignedUrlIssued implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public SignedUrlAudit $audit,
        public string $url,
    ) {
    }
}
