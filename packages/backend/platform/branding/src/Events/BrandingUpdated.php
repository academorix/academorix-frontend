<?php

declare(strict_types=1);

namespace Stackra\Branding\Events;

use Stackra\Branding\Models\Branding;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Branding profile is updated.
 *
 * Payload carries the dirty column list so listeners can filter
 * (a color-only change need not re-render the OG image).
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'branding.branding.updated')]
final readonly class BrandingUpdated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  array<int, string>  $dirty  Column names that changed.
     */
    public function __construct(
        public Branding $branding,
        public array $dirty,
    ) {
    }
}
