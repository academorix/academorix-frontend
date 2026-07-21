<?php

declare(strict_types=1);

namespace Stackra\Branding\Events;

use Stackra\Branding\Models\Branding;
use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a tenant admin resets their branding to platform
 * defaults via `POST /api/v1/tenant/branding/reset`.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'branding.branding.reset')]
final readonly class BrandingReset implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public Branding $branding)
    {
    }
}
