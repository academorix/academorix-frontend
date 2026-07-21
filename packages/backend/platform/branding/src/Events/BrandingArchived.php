<?php

declare(strict_types=1);

namespace Stackra\Branding\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Branding row is soft-deleted (archived).
 *
 * Carries plain scalars because the row is a tombstone at dispatch time.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'branding.branding.archived')]
final readonly class BrandingArchived implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $tenantId,
        public string $brandingId,
    ) {
    }
}
